---
layout: post
title: "Abstracting control flow"
date: 2013-10-08 12:13
comments: true
categories: [Control Flow, Python]
---

Any programmer, even if she doesn't see it this way, constantly creates abstractions. The most common things we abstract are calculations (caught into functions) or behavior (procedures and classes), but there are other recurring patterns in our work, especially, in error handling, resource management and optimizations.

What does abstracting control flow mean? In conventional code (where nobody plays too smart "showing off"?) control structures do control flow. Sometimes they don't do that well and then we through in our own, which is simple in lisp, Ruby or Perl, but also possible in a way in any language featuring higher order functions.

..cut

Что значит абстрагирование потока управления или "control flow", как выражаются наши заморские друзья? В случае, когда никто не выпендривается, потоком занимаются управляющие конструкции. Иногда этих управляющих конструкций недостаточно и мы дописываем свои, абстрагирующие нужное нам поведение программы. Это просто в языках вроде lisp, ruby или perl, но и в других языках это возможно, например, с помощью функций высшего порядка.<habracut />


## Abstractions

Начнём с начала. Что нужно сделать, чтобы построить новую абстракцию?

- Выделить какой-то кусок функциональности или поведения.
- Дать ему имя.
- Реализовать его.
- Спрятать реализацию за выбранным именем.

Надо сказать, что третий пункт выполним далеко не всегда. Возможность реализации сильно зависит от гибкости языка и от того, что вы абстрагируете.

Что делать если ваш язык недостаточно гибок? Ничего страшного, вместо реализации вы можете просто подробно описать свой приём, сделать его популярным и, таким образом, породить новый "паттерн проектирования". Или просто перейти на более мощный язык, если создание паттернов вас не прельщает.

Но довольно теории, займёмся делом...


### Пример из жизни

Обычный код на питоне (взят из реального проекта с минимальными изменениями):

``` python
urls = ...
photos = []

for url in urls:
    for attempt in range(DOWNLOAD_TRIES):
        try:
            photos.append(download_image(url))
            break
        except ImageTooSmall:
            pass # пропускаем урл мелкой картинки
        except (urllib2.URLError, httplib.BadStatusLine, socket.error), e:
            if attempt + 1 == DOWNLOAD_TRIES:
                raise
```

У этого кода множество аспектов: итерация по списку url, загрузка изображений, сбор загруженных изображений в photos, пропуск мелких картинок, повторные попытки загрузки при возникновении сетевых ошибок. Все эти аспекты запутаны в единый кусок кода, хотя многие из них были бы полезны и сами по себе, если бы только мы могли их вычленить.

В частности итерация + сбор результатов реализованы во встроенной функции <code>map</code>:

``` python
photos = map(download_image, urls)
```
Попробуем выудить и остальные аспекты. Начнём с пропуска мелких картинок, он мог бы выглядеть так:

``` python
@contextmanager
def skip(error):
    try:
        yield
    except error:
        pass

for url in urls:
    with skip(ImageTooSmall):
        photos.append(download_image(url))
```
Неплохо, но есть недостаток - пришлось отказаться от использования <code>map</code>. Оставим пока эту проблему и перейдём к аспекту устойчивости к сетевым ошибкам. Аналогично предыдущей абстракции можно было бы написать:

``` python
with retry(DOWNLOAD_TRIES, (urllib2.URLError, httplib.BadStatusLine, socket.error)):
    # ... do stuff
```
Только вот это не будет работать, <code>with</code> в питоне не может выполнить свой блок кода более одного раза. Мы уткнулись в ограничения языка и теперь вынуждены либо свернуть и использовать альтернативные решения, либо породить ещё один "паттерн". Замечать подобные ситуации важно, если вы хотите понять различия в языках, и чем один может быть мощнее другого, несмотря на то, что они все полны по Тьюрингу. В ruby и с меньшим удобством в perl мы могли продолжить манипулировать блоками, в лиспе - блоками или кодом (последнее в данном случае, видимо, ни к чему), в питоне нам придётся использовать альтернативный вариант.

Вернёмся к функциям высшего порядка, а точнее к их особой разновидности - декораторам:

``` python
@decorator
def retry(call, tries, errors=Exception):
    for attempt in range(tries):
        try:
            return call()
        except errors:
            if attempt + 1 == tries:
                raise

http_retry = retry(DOWNLOAD_TRIES, (urllib2.URLError, httplib.BadStatusLine, socket.error))
harder_download_image = http_retry(download_image)
photos = map(harder_download_image, urls)
```
Как мы видим, подобный подход хорошо стыкуется с использованием <code>map</code>, также мы получили пару штучек, которые нам ещё когда-нибудь пригодятся - <code>retry</code> и <code>http_retry</code>.

Перепишем <code>skip</code> в том же стиле:

``` python
@decorator
def skip(call, errors=Exception):
    try:
        return call()
    except errors:
        return None

skip_small = skip(ImageTooSmall)
http_retry = retry(DOWNLOAD_TRIES, (urllib2.URLError, httplib.BadStatusLine, socket.error))
download = http_retry(skip_small(download_image))
photos = filter(None, map(download, urls))
```
<code>filter</code> понадобился, чтобы пропустить отброшенные картинки. На самом деле, шаблон <code>filter(None, map(f, seq))</code> настолько часто встречается, что в некоторых языках есть <a href="http://clojuredocs.org/clojure_core/clojure.core/keep">встроенная функция для такого случая</a>.

Мы тоже можем такую реализовать:

``` python
def keep(f, seq):
    return filter(None, map(f, seq))

photos = keep(download, urls)
```
Что в итоге? Теперь все аспекты нашего кода на виду, легко различимы, изменяемы, заменяемы и удаляемы. А в качестве бонуса мы получили набор абстракций, которые могут быть использованы в дальнейшем. А ещё, надеюсь, я заставил кого-нибудь увидеть новый способ сделать свой код лучше.

<b>P.S.</b> Реализацию <code>@decorator</code> можно взять <a href="https://github.com/Suor/funcy/blob/master/funcy/decorators.py">здесь</a>.

<b>P.P.S.</b> Другие примеры абстрагирования потока управления: <a href="http://underscorejs.org/#functions">манипуляции с функциями в underscore.js</a>, списковые и генераторные выражения, <a href="https://github.com/Suor/overload">перегрузка функций</a>, кеширующие обёртки для функций и многое другое.

<b>P.P.P.S.</b> Серьёзно, нужно придумать перевод получше для выражения "control flow".

