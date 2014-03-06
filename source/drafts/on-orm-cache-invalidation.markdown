---
layout: post
title: "On ORM Cache Invalidation"
comments: false
sharing: false
published: false
categories: [Algorithms]
---

Cache invalidation is probably on of the hardest things in computer programming. I understand it as finding a subtle compromise between completeness, redundancy and complexity. I would like to tap into this topic in context of caching queries built via ORM.

<!--more-->

I will move from basic ideas building upon them as needed and diving into more and more specifics as the post goes.

<!--

to complex ones using more and more specifics

 -->
<!-- ... write here that we will start from basics and only use ORM power when we start needing it. -->


## Completeness and redundancy

Let's start from some general considerations. I define abovesaid completeness as a characteristic of invalidation procedure describing how frequent and under what circumstances data can become dirty and how long it will remain accessible. And redundancy will be a frequency and a volume of cache invalidated needlessly.

An example will help us perceive these two concepts better. Let's look at common time-invalidated cache. On one hand, it inevitably leads to dirty data between update and cache timeout, making this algorithm inherently incomplete. On other hand, we can easily reduce incompleteness by reducing cache timeout, which, in it's turn, will increase redundancy - clean cache data will be invalidated more frequently, which will lead to more cache misses. And for ideal completeness (no dirty data) we need to set timeout to zero.

There are lots of scenarios where it's ok to use stale data: popular articles list doesn't change fast and it's not a big deal if user count of your social network is off by a couple of thousands. But then there are some scenarios where you need immediate invalidation, go to next section for that.


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


## Automatic invalidation

We not even started utilizing a power of ORM. Its query is not a mere text and plain arguments, it is a structure which includes condition tree. And some smart code could use that information to determine when query cache should be invalidated, saving work for lazy guys like me.

Suppose we cache a query:

``` sql
select * from post where category_id = 2 and published
```

We should drop that cache when we add, update or delete post with its old or new state satisfying `category_id = 2 and published` condition. So the time we save that cache we write along "invalidator" like that:

``` sql
category_id = 2 and published: K1 -- K1 is above query cache key
```

Then if some post changes we look up all invalidators and check their conditions with post at hand, deleting cache keys corresponding to holding ones. That could become very inefficient once we'll have lots of queries cached.

The reason we will end up with lots of invalidators is that we have cache lots of different queries. In common use, however, most queries will differ only in parameters not structure. Maybe separating those will help us? Let's try on larger example. Here be the queries:

``` sql
select * from post where category_id = 2 and published           -- K1
select * from post where category_id = 2 and published limit 20  -- K2
select * from post where category_id = 3 and published           -- K3
select * from post where category_id = 3 and not published       -- K4
select * from post where id > 7                                  -- K5
select * from post where category_id = 2 and published or id > 7 -- K6
select * from post where category_id in (2, 3) and published     -- K7
select * from post where category_id = 2 and id < 7              -- K8
```

Unseparated invalidators first:

``` sql
category_id = 2 and published:           K1, K2
category_id = 3 and published:           K3
category_id = 3 and not published:       K4
id > 7:                                  K5
category_id = 2 and published or id > 7: K6
category_id in (2, 3) and published:     K7
category_id = 3 and id < 7:              K8
```

We can use some tricks to make this more regular. `or`ed conditions could be split into two, `in` is basically syntax sugar for `or` and boolean tests could be substituted with equalities. Applying these we get to:

``` sql
category_id = 2 and published = true:  K1, K2, K6, K7
category_id = 3 and published = true:  K3, K7
category_id = 3 and published = false: K4
id > 7:                                K5, K6
category_id = 3 and id < 7:            K8
```

Note that after this transformation all conditions became simple conjunctions. And we are finally ready to separate condition scheme from data:

``` sql
-- Schemes
category_id = ? and published = ? -- S1
id > ?                            -- S2
category_id = ? and id < ?        -- S3

-- Conjunctions
S1:2,true:  K1, K2, K6, K7
S1:3,true:  K3, K7
S1:3,false: K4
S2:7:       K5, K6
S3:3,7:     K8
```

Time to try modeling invalidation procedure. Say we are adding this post to our stock:

``` sql
{id: 42, category_id: 2, published: true, title: "...", content: "..."}
```

Looking at `S1` we can see that there is at most one conjunction of that scheme satisfying our state! Even better, we can build it from scheme and object data by looking at field values. Too bad the trick won't work with `S2` cause our post id, 42, is greater than many things. To find what queries of scheme `S2` should be invalidated one needs to look through all `S2:*` conjunctions and that could be a lot.

This is probably a case for trade-off. Dropping all conditions but equalities we will sacrifice invalidation granularity, but simplify and speed up the procedure. Simplified invalidators will look like:

``` sql
-- Schemes
category_id = ? and published = ? -- S1
                                  -- S2, an empty scheme
category_id = ?                   -- S3

-- Conjunctions
S1:2,true:  K1, K2, K6, K7
S1:3,true:  K3, K7
S1:3,false: K4
S2::        K5, K6 -- no data for S2
S3:3:       K8
```

There are some points worth noting here. First, `S2` is now an empty scheme with a single empty conjunction which is always true, which means `K5` and `K6` will be invalidated on any post change. Second, schemes are now just sets of field names, pretty neat.

So far I tried to stay language and platform agnostic, but that journey came to an end. Welcome to dirty reality in the next section.


## Implementation tips

- A best way to represent scheme is probably alphabetically sorted list of field names, it's easily serializable and it makes building a conjunction for an object pretty straightforward.

- Extracting conjunctions from a query tree could be tricky. One might want to employ [fuzzy logic][fuzzy]: look at `not (f > 0 and g != 1)`, if we drop `f > 0` right away, we'll end up with `g = 1`, which is not equivalent to `f <= 0 or g = 1`. Lost empty conjunction along the way!

- Considering invalidator structure (sets) and taking into account that it is generally a good idea to keep all interdependent data together (cache and invalidators) this is an excellent case to use [Redis][]. Using it we can easily add keys to conjunctions, we can even do `SUNION` of conjunctions to fetch all dirty keys in one shot.

Sure, I went ahead and used that tips in my [Django caching solution][cacheops]. Hope it or ideas it embodies would be helpful.


[fuzzy]: http://en.wikipedia.org/wiki/Fuzzy_logic
[redis]: http://redis.io
[cacheops]: https://github.com/Suor/django-cacheops
