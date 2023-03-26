# Многоликий двухфазовый рендеринг

Недавно я выполнял небольшой заказ о ревью группы проектов, один из которых использовал `aiohttp` с `jinja2` и концепцию джангоподобных вьюх, что порождало повторяющийся шаблонный код практически во всех этих вьюхах. Моей рекомендацией было использовать двухфазовый рендеринг. Отмечу, что к подобному решению я прихожу уже как минимум в третий раз, а потому подход сам по себе должен представлять интерес.

Но не будем забегать вперёд, что же там с рендерингом шаблонов в асинхронной среде?


## Асинхронный веб и шаблонизация

Вот как это примерно выглядело в обозреваемом мной коде:

```python
async def articles_page(request):
    (
        context,
        categories_menu_block,
        top_articles_block,
        main_articles_by_categories_block,
        recent_news_block,
    ) = await asyncio.gather(
        get_common_blocks(request),
        CategoriesMenuBlock(request).content(),
        _get_top_articles(request),
        _get_main_articles_by_categories(request),
        get_recent_news(request),
    )

    context.update({
        'categories_menu_block': categories_menu_block,
        'top_articles_block': top_articles_block,
        'main_articles_by_categories_block': main_articles_by_categories_block,
        'recent_news_block': recent_news_block
    })
    response = aiohttp_jinja2.render_template(
        'articles/pages/articles.html', request, context
    )
```

Мы подтягиваем данные для многих блоков или даже блоки в html, слепляем их в контекст и рендерим. Проблема, в том, что блоки повторяются на многих страницах, а потому код дублируется. Проблема эта, ктстати, не является чем-то специфичным для асинхронного веба, подобная, но полностью синхронная джанговская вьюха могла бы выглядеть так:

```python
def articles_page(request):
    context = get_common_blocks(request)
    context.update({
        'categories_menu_block': CategoriesMenuBlock(request).content(),
        'top_articles_block': _get_top_articles(request),
        'main_articles_by_categories_block': _get_main_articles_by_categories(request),
        'recent_news_block': get_recent_news(request)
    })
    return render(request, 'articles/pages/articles.html', context)
```

Код выглядит менее громоздко, однако, принципиальное дублирование сохраняется. Более того, ситуация когда каждая страница должна знать обо всех блоках, которые на ней находятся не выглядит удобной и технологичной. Ошибка, очевидно, в архитектуре и архитектурной же адаптацией и должна решаться.


### MVC Push и MVC Pull

В рамках идеологии MVC для веба &mdash; разделения работы с данными и шаблонов, есть два подхода передачи этих самых данных: передача в шаблон (push) либо подтягивание шаблоном (pull). Первый хорошо работает для простых страниц и сайтов, но для порталов не очень: обилие общих блоков на разных страницах порождает дублирующийся код во многих вьюхах, как мы видели выше.

Традиционное решение &mdash; использование подхода MVC Pull для повторяющихся блоков (в остальном страница может рендерится как обычно). В случае с `jinja2` это реализуется регистрацией функций для вызова из шаблона. Такая функция может вызываться напрямую, если она возвращает html, либо использоваться в инклуде или макросе &mdash; в стиле сам данные подтянул, тут же срендерил.

В контексте асихронного веба всё усложняется, т.к. мы не хотим подтягивать данные последовательно когда рендерится шаблон, а хотим сразу всё подтянуть, чтобы распараллелить эти процесы и потом уже срендерить. На данный момент это достигается с помощью вызова `asyncio.gather()` в начале вьюхи.


### Двухфазовый рендеринг

Рещением может быть двухстадийный рендеринг шаблона:
- блок при вызове выдаёт какую-то неповторяющуюся строку (можно случайную)
- запускает процесс вычисления блока
- записывает future/task/... в специальный словарь с той же неповторяющейся строкой в качестве ключа

```python
# A block
@contextfunction
def top_articles_block(ctx, count=10):
    placeholder = 'top_articles_block'
    ctx['to_replace'][placeholder] = _top_articles_block(context['request'], count)
    return '$$$%s$$$' % placeholder

@cached
@with_postgres_client
async def _top_articles_block(request, count=10, connection=None):
    # ...
    return html

# A view
async def articles_page(request):
    context = {'to_replace': {}, ...}
    response = aiohttp_jinja2.render_template(
        'articles/pages/articles.html', request, context
    )
    fragments = asyncio_gather_dict(to_replace)
    response.text = re.sub(r'$$$(\w+)$$$', lambda m: fragments[m.group(0)], response.text)
    return response
```

Конечно, всё это веселье следует завернуть в декораторы или хелперы:

```python
@async_block
@cached
@with_postgres_client
async def top_articles_block(request, count=10, connection=None):
    # ...

async def articles_page(request):
    context = {...}
    return await async_render(request, 'articles/pages/articles.html', context)
```

В данном виде это позволяет подтягивать только блоки html, а не данные, для последующего рендеринга, но при желании с данными тоже можно извернуться, понадобиться кастомный тег, откладывающий рендеринг своего содержимого.


Начну с небольшого отступления для асинхронного веба не специфичного,

о том, что это такое, а также о конкретной проблеме и её решении я подробней расскажу ниже, а пока
