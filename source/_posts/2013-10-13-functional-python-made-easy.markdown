---
layout: post
title: "Functional Python Made Easy"
comments: true
date: 2013-10-13 19:22
categories: [FP, Python]
hn_id: 6542224
reddit_url: http://www.reddit.com/r/Python/comments/1oej74/functional_python_made_easy_with_a_new_library/
---


There are a lot of buzz about Haskell, Lisp, Erlang and other languages few people code in. But while they play their role as banners, functional programming sneaks into our code in multi-paradigm languages.

I was going to continue this way and later introduce my library of a variety of functional tricks, but suddenly realized it's not about FP, it's about utility. And that's what I will focus on below trying to show you real-life value of [funcy][].

<!--more-->

Funcy started from a try to bunch up a couple of data manipulation utils. Therefore most of my examples will be about that. Some of them may seem trivial to you, but there are many gains these tiny tools can offer you both in terms of code brevity and expressiveness. Or they'll just save your time, still good.

I'll go through the typical tasks any python programmer face during her day.


## Everyday data manipulation

*1. Flatten list of lists. That's how you usually do it:*

``` python
from operator import concat
reduce(concat, list_of_lists)

# or that:
sum(list_of_lists, [])

# or that:
from itertools import chain
list(chain.from_iterable(list_of_lists))
```

They all work and all have their flaws: require imports, additional calls or restrict what you can pass into. But the main flaw is that they are all patterns not obvious calls. There should be a simple function to do such a simple and common thing and there is one in funcy:

``` python
from funcy import cat
cat(list_of_lists)
```

`cat` joins list of lists, tuples, iterators and generally any iterables into single list. And it comes with extra shortcut if you want to `cat` results of `map` call. For example, this

``` python
from funcy import mapcat
mapcat(str.splitlines, bunch_of_texts)
```

will result in flat list of all lines of all the texts. There are lazy versions of both functions: `icat` and `imapcat`.


*2. Merge some dicts. There are several clumsy ways in python:*

``` python
d1.update(d2)  # Changes d1
dict(d1, **d2) # Really awkward for more than 2 dicts

d = d1.copy()
d.update(d2)
```

I always wondered why one can't just add them up, but that's what we have. Anyway, this is also easy in funcy:

``` python
from funcy import merge, join
merge(d1, d2)
merge(d1, d2, d3)
join(sequence_of_dicts)
```

The best part here is these are omnivorous. They work with anything: sets, dicts, ordered dicts, lists, tuples, iterators, even strings, carefully preserving collection type.


*3. Capturing something with regular expression. A usual way:*

``` python
m = re.search(some_re, s)
if m:
    actual_match = m.group() # or m.group(i) or m.groups()
    ...
```

Much more straightforward with funcy:

``` python
from funcy import re_find
actual_match = re_find(some_re, s)
```

Still not impressed? Then look here:

``` python
from funcy import re_finder, re_all, partial, mapcat

# Get a number out of every word
map(re_finder('\d+'), words)

# Parse simple ini file into dict
# (re_finder returns tuples when there is more that one capture in regexp)
dict(imap(re_finder('(\w+)=(\w+)'), ini.splitlines()))

# Find all numbers in all the strings and return as flat list
mapcat(partial(re_all, r'\d+'), bunch_of_strings)
```

## About imports and practicality

As you can see I import everything directly from funcy, not using any sub-packages. The reason it's designed this way is practicality. That would be too annoying to remember where each one tiny thing comes from. There are enough libraries to clutter your file heads anyway.

This also enables you to write:

``` python
from funcy import *
```

And start enjoying all functional python niceness right away. Ok, now when you know where all the stuff is kept I won't repeat imports in every new example.


## A bit more functional things

We've seen a pair of examples of higher order functions earlier, particularly `re_finder` and `partial`. One thing to note is that `re_finder` itself is a partial application of `re_find` meant to be used with `map` and friends. Naturally, there is a similar utility to be used with `filter`:

``` python
# Choose all private attributes of an object
is_private = re_tester('^_')
filter(is_private, dir(some_obj))
```

We can create a bunch of predicates and filter with them:

``` python
is_special = re_tester('^__.+__$')
is_const = re_tester('^[A-Z_]+$')
filter(...)
```

But what if we want to apply several of them at once or use some predicate logic. That's easy:

``` python
is_public = complement(is_private)
is_private_const = all_fn(is_private, is_const)
either_const_or_public = any_fn(is_const, is_public)
```

Or you can use convenience function complementary to `filter`:

``` python
remove(is_private, ...) # same as filter(is_public)
```

I hope everyone have their functional appetite satisfied so we can switch to something less abstract.


## Collections

Aside from [sequence utilities][docs.seqs], funcy provides lots of ones to work with collections.
And the two fundamental are `walk` and `select`, a versions of `map` and `filter` preserving collection type:

[docs.seqs]: http://funcy.readthedocs.org/en/latest/seqs.html

``` python
walk(inc, {1, 2, 3}) # -> {2, 3, 4}
walk(inc, (1, 2, 3)) # -> (2, 3, 4)

# Mapping function receives pairs when walking dicts
swap = lambda (k, v): (v, k)
walk(swap, {1: 10, 2: 20})
# -> {10: 1, 20: 2}

select(even, {1, 2, 3, 10, 20})
# -> {2, 10, 20}

select(lambda (k, v): k == v, {1: 1, 2: 3})
# -> {1: 1}
```

This pair of functions is backed up with a set of ones to work with dicts: `walk_keys`, `walk_values`, `select_keys`, `select_values`:

``` python
# Get a dict of public attributes of an instance
select_keys(is_public, instance.__dict__)

# Clean dict of falsy values
select_values(bool, some_dict)
```

The last example in this section will include several new functions at once: `silent` - catches all exceptions in passed function, returning `None`; `compact` - removes falsy values from collection; `walk_values` - maps dict values with given function. Anyhow, this line constructs a dict of integer params from typical stringy request dict you get:

``` python
compact(walk_values(silent(int), request_dict))
```


## Back to data manipulation

Finally, the interesting part. I included some examples here just because they seem cool. Although, I did this earlier to be honest. Anyway, let's split and group:

``` python
# split absolute and relative urls
absolute, relative = split(re_tester(r'^http://'), urls)

# group posts by category
group_by(lambda post: post.category, posts)
```

Partition and chunk:

``` python
# make a dict from flat list of pairs
dict(partition(2, flat_list_of_pairs))

# make a structures from flat list
{id: (name, password) for id, name, password in partition(3, users)}

# check versions are consecutive
assert all(prev + 1 == next for prev, next in partition(2, 1, versions)):

# process data by chunks
for chunk in chunks(CHUNK_SIZE, lots_of_data):
    process(chunk)
```

And a couple more, just for fun:

``` python
# add new line indents at the beginning of each paragraph
for line, prev in with_prev(text.splitlines()):
    if not prev:
        print '    ',
    print line

# select Shakespeare's play written in 1611
where(plays, author="Shakespeare", year=1611)
# => [{"title": "Cymbeline", "author": "Shakespeare", "year": 1611},
#     {"title": "The Tempest", "author": "Shakespeare", "year": 1611}]
```

## More than just a library

Maybe some of you recognized some functions from Clojure or Underscore.js (Shakespear example was shamelessly ripped of the docs of the latter, for example). That should not surprise you, in many respects I drew inspiration from these two sources. Nonetheless I followed python spirit and stayed practical as far as I could.

And one more thought. We used to call programming languages languages, still rarely think of keywords and functions as words. We define our own words by writing new functions, but they are usually too specific to make it into our everyday use. Funcy utilities are designed the other way around, to be broadly used as a layer over python and it's standard library.

So, how about [extending your vocabulary][funcy]?

[funcy]: https://github.com/Suor/funcy
