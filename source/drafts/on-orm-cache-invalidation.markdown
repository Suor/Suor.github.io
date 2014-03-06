---
layout: post
title: "On ORM Cache Invalidation"
comments: false
sharing: false
published: false
categories: [Algorithms]
---

Cache invalidation is probably on of the hardest things in computer programming. I understand it as finding a subtle compromise between completeness, redundancy and complexity. I would like to tap into this topic in context of caching SQL queries built via ORM.

<!--more-->

... write here that we will start from basics and only use ORM power when we start needing it.


## Completeness and redundancy

Let's start from some general considerations. I define abovesaid completeness as a characteristic of invalidation procedure describing how frequent and under what circumstances data can become dirty and how long it will remain accessible. And redundancy will be a frequency and a volume of cache invalidated needlessly.

An example will help us perceive these two concepts better. Let's look at common time-invalidated cache. On one hand, it inevitably leads to dirty data between update and cache timeout, making this algorithm inherently incomplete. On other hand, we can easily reduce incompleteness by reducing cache timeout, which, in it's turn, will increase redundancy - clean cache data will be invalidated more frequently, which will lead to more cache misses. And for ideal completeness (no dirty data) we need to set timeout to zero.

There are lots of scenarios where it's ok to use stale data: most read articles list doesn't change fast and it's not a big deal if user count of your social network is off by a couple of thousands. But then there are some scenarios where you need immediate invalidation, go to next section for that.


## Event-driven invalidation

Probably, the only way to achieve ideal invalidation completeness is to invalidate each time you change data. There are elements of such system we need to think about:

- cached things,
- events,
- a dependency matrix explaining what thing to invalidate on what event.

There are obviously different strategies to define those in your code. I'll start from simplest one - manual definition.


## Coding dependencies by hand

First, cached things, they will probably look like this (in sort of python pseudo-code):

``` python
# An ellipsis means some code or instruction to get corresponding data
register_cached_item('post_by_id', ...)
register_cached_item('posts_by_category', ...)
register_cached_item('recent_posts', ...)
register_cached_item('posts_by_tag', ...)

# Used like
post = get('post_by_id', 10)
invalidate('post_by_id', 10)
```

Remember this is pseudo-code. `register_cached_item()` don't need to be a function call, it could be a decorator in Python, macro in lisp or class in Java.

Ok, say we have some place in our code that adds post, we then need to add something like this there:

``` python
# ...
# Just added post, need to invalidate things
invalidate('post_by_id', post.id)
invalidate('posts_by_category', post.category_id)

# It could be recent
invalidate('recent_posts')

# Invalidate for all tags
for tag in post.tags:
    invalidate('posts_by_tag', tag)
```

And if we delete post somewhere we need to make invalidation there too. We should obviously abstract our code into some `invalidate_post()` function and call it from both places. So far, so good. What about updating? The thing is it's not enough to just call our invalidation procedure from there:

``` python
post = get('post_by_id', 10)
assert post.category == 1
post.category = 2

update_post(post)
invalidate_post(post) # posts_by_category not invalidated for category 1!
```

We need to invalidate on both old and new state of a post on update. How we get old state is a separate not an easy question, but suppose we have both states, should we just call `invalidate_post()` twice for each of them? Not so efficient, but that would work.

There is a problem with our code though. It's tightly coupled - update logic knows about cache logic. Even bigger problem is that our cache logic is scattered. We define cached thing in one place and invalidate in another or several other places. This means there will come some day when someone will add a cached thing and just forget to add corresponding invalidation, producing hard to find bug.


## Bringing things together

Fortunately, there is a single solution to both problems - events. We can write fetching and invalidation logic for each thing in one place and then register both cached thing and event listener:

``` python
def post_by_id(id):
    # ...

def invalidate_post_by_id(post): # event signature here
    invalidate('post_by_id', post.id)

register_cached_thing('post_by_id', fetch=post_by_id, invalidate=invalidate_post_by_id)
```

As invalidate procedures would be tiresomely repetitive we can dry this up to (and even further using particular language sugar features):

``` python
def post_by_id(id):
    # ...
register_cached_thing('post_by_id', fetch=post_by_id, arg=lambda p: p.id)
```

Looks like we've come up with pretty solid system. It's dry, but retains flexibility of still mostly manual system. We, however, need to declare each thing we plan to cache in advance. We also need to provide argument constructing functions. There got to be a smarter way.

<!-- , let's utilize a power of ORM.

 utilizing a power of ORM.

We not even started utilizing a power of ORM. There got to be a smarter way.
 -->


## Automatic ORM queries invalidation

We not even started utilizing a power of ORM. Its query is not a mere text and plain arguments, it's a structure including condition tree. And some smart code could use that information to determine when query cache should be invalidated.

Вспомним, что у нас есть ORM, а для него каждый запрос представляет не просто текст, а определённую структуру - модели, дерево условий и прочее. Так что, по идее, ORM может и кешировать и вешать инвалидационные обработчики прямо при кешировании по мере надобности. Чертовски привлекательное решение для ленивых ребят, вроде меня.

Небольшой пример. Допустим мы выполняем запрос:

``` sql
select * from post where category_id=2 and published
```

и кешируем его. Очевидно, нам нужно сбросить запрос если при добавлении/обновлении/удалении поста для его старой или новой версии выполняется условие `category_id=2 and published=true`. Через некоторое время для каждой модели образуются списки инвалидаторов, каждый из которых хранит список запросов, которые должен сбрасывать:

``` sql
post:
    category_id=2 and published=true:
        select * from post where category_id=2 and published
        select count(*) from post where category_id=2 and published
        select * from post where category_id=2 and published limit 20
    category_id=3 and published=true:
        select * from post where category_id=3 and published limit 20 offset 20
    category_id=3 and published=false:
        select count(*) from post where category_id=3 and not published
foo:
    a=1 or b=10:
        or_sql
    a in (2,3) and b=10:
        in_sql
    a&gt;1 and b=10:
        gt_sql
```

и т.д. В реальности в инвалидаторах удобнее хранить списки ключей кеша, а не тексты запросов, тексты здесь для наглядности.

Посмотрим, что будет происходить при добавлении объекта. Мы должны пройти по всему списку инвалидаторов и стереть ключи кеша для условий, выполняющихся для добавленного объекта. Но инвалидаторов может быть много, и храниться они должны там же где сам кеш, т.е. скорее всего не в памяти процесса и загружать их все каждый раз не хотелось бы, да и последовательная проверка всех условий больно долга.

Очевидно, нужно как-то группировать и отсеивать инвалидаторы без их полной проверки. Заметим, что картина когда условия различаются только значениями. Например, инвалидаторы в модели `post` все имеют вид `category_id=? and published=?`. Сгруппируем инвалидаторы из примера по схемам:

``` sql
post:
    category_id=? and published=?:
        2, true:
            select * from post where category_id=2 and published
            select count(*) from post where category_id=2 and published
            select * from post where category_id=2 and published limit 20
        3, true:
            select * from post where category_id=3 and published limit 20 offset 20
        3, false:
            select count(*) from post where category_id=3 and not published
foo:
    a=? or b=?:
        1, 10:
            or_sql
    a in ? and b=?:
        (2,3), 10:
            in_sql
    a &gt; ? and b=?:
        1, 10:
            gt_sql
```

Обратим внимание на условие `category_id=?` and `published=?`, зная значения полей добавляемого поста, мы можем однозначно заполнить метки "`?`". Если объект:

```
{id: 42, title: "...", content: "...", category_id: 2, published: true}
```

, то единственный подходящий инвалидатор из семейства будет `category_id=2` and `published=true` и, следовательно нужно стереть соответствующие ему 3 ключа кеша. Т.е. не требуется последовательная проверка условий мы сразу получаем нужный инвалидатор по схеме и данным объекта.

Однако, что делать с более сложными условиями? В отдельных случаях кое-что можно сделать: `or` разложить на два инвалидатора, `in` развернуть в `or`. В остальных случаях либо придётся всё усложнить, либо сделать инвалидацию избыточной, отбросив такие условия. Приведём то, какими будут инвалидаторы для `foo` после таких преобразований:

```
foo:
    a = ?:
        1: or_sql
    b = ?:
        10: or_sql, gt_sql
    a = ? and b = ?:
        2, 10: in_sql
        3, 10: in_sql
```

Таким образом, нам нужно для каждой модели только хранить схемы (просто списки полей), по которым при надобности мы строим инвалидаторы и запрашиваем списки ключей, которые следует стереть.

Приведу пример процедуры инвалидации для foo. Пусть мы запросили из базы объект `{id: 42, a: 1, b: 10}` сменили значение `a` на `2` и записали обратно. При обновлении процедуру инвалидации следует прогонять и для старого, и для нового состояния объекта. Итак, инвалидаторы для старого состояния: `a=1, b=10, a=1 and b=10`, соответствующие ключи `or_sql` и `gt_sql` (последний инвалидатор отсутсвует, можно считать пустым). Для нового состояния получаем инвалидаторы `a=2, b=10, a=2 and b=10`, что добавляет ключ `in_sql`. В итоге стираются все 3 запроса.



## Реализация

Я старался по-возможности абстрагироваться от языка и платформы, однако, рабочая и работающая в довольно нагруженном проекте система тоже существует. Подробнее о ней и о хитростях реализации вообще в следующей статье.
