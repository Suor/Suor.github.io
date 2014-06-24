---
layout: post
title: "Why Every Language Needs Its Underscore"
comments: true
sharing: true
date: 2014-06-22 19:39
categories: [FP]
hn_id: 7927578
---

*(This is an adaptation of a talk I gave at PyCon and DevDay. [Slides](http://www.slideshare.net/hackflow/why-underscore) and [video](http://www.youtube.com/watch?v=lGAC6ftYUS0#t=12100) are available in russian)*

Do you know what [underscore][] is? In its most general it's a JavaScript library that makes life better. For whoever writes in JavaScript. I mostly write Python and I also wanted my life better, so I went ahead and wrote [a similar library for Python][funcy]. But the thing is you need to understand a magic behind something to properly replicate it. So what's the magic behind _?

<!--more-->


## The problem

To answer this question we should look at problems this kind of libraries solve. To get some ground I'll illustrate them with code. That will be in python, but all the ideas are universal, so don't be afraid.


### A piece of entangled code

This messy piece of code was taken from a real project and slightly simplified:

<div class="example-bad">
``` python
images = []
for url in urls:
    for attempt in range(DOWNLOAD_TRIES):
        try:
            images.append(download_image(url))
            break
        except HttpError:
            if attempt + 1 == DOWNLOAD_TRIES:
                raise
```
</div>

There are several things entangled in here, but my point is that this could be written much shorter:

<div class="example-good">
``` python
http_retry = retry(DOWNLOAD_TRIES, HttpError)
images = map(http_retry(download_image), urls)
```
</div>

If it seems hard at first, then it's okay. It involves some functions and [control flow abstractions][acf] most probably new to you. Once you get used to it you'll find that the latter variant is not only shorter, but is also simpler.


### Dirty dictionary

But let's go on and clean some dirty dictionary:

<div class="example-bad">
``` python
d = {}
for k, v in request.items():
    try:
        d[k] = int(v)
    except (TypeError, ValueError):
        d[k] = None
```
</div>

Here we go through dictionary and clean its values by coercing them to `int`. Or to `None` if that is impossible. Cleaning input and ignoring malformed data is quite frequent task and yet it takes so much effort. This is the way I want to write that:

<div class="example-good">
``` python
walk_values(silent(int), request)
```
</div>

And it's entirely possible with [funcy][]. But let's move to the next one.


### Pairwise iteration

This code checks if a sequence is ascending:

<div class="example-bad">
``` python
prev = None
for x in seq:
    if prev is not None and x <= prev:
        is_ascending = False
        break
    prev = x
else:
    is_ascending = True
```
</div>

Ah, iterating over a sequence and keeping track of a previous element. How many times had you done that? There should be a function to abstract it:

<div class="example-good">
``` python
is_ascending = all(l < r for l, r in pairwise(seq))
```
</div>

And [pairwise][] does exactly that. It enables us to iterate by sequence adjacent pairs. So we just need to check that all of them are ordered accordingly.

### ...

All these examples have one common property -- red variants have more code. And more code:

- takes longer to write,
- takes longer to read,
- takes longer to debug,
- contains more bugs.

Obviously, underscore, funcy and friends help us write less code (at least in this three examples). But how do they do that?


## Extracting abstractions

Let's take another look at the first example. It does three things in a single blob of code:

<figure class='code'><figcaption><span></span></figcaption><div class="highlight"><table><tr><td class="gutter"><pre class="line-numbers"><span class='line-number'>1</span>
<span class='line-number'>2</span>
<span class='line-number'>3</span>
<span class='line-number'>4</span>
<span class='line-number'>5</span>
<span class='line-number'>6</span>
<span class='line-number'>7</span>
<span class='line-number'>8</span>
<span class='line-number'>9</span>
</pre></td><td class='code'><pre><code><span class='green'>images</span> <span class='blue'>= []
</span><span class='blue'>for url in</span> <span class='green'>urls</span><span class='blue'>:
</span><span class='red'>    for attempt in range(DOWNLOAD_TRIES):
</span><span class='red'>        try:
</span><span class='green'>            images</span><span class='blue'>.append(</span><span class='green'>download_image(</span><span class='blue'>url</span><span class='green'>)</span><span class='blue'>)
</span><span class='red'>            break
</span><span class='red'>        except HttpError:
</span><span class='red'>            if attempt + 1 == DOWNLOAD_TRIES:
</span><span class='red'>                <span class="k">raise
</span></code></pre></td></tr></table></div></figure>

I highlighted every aspect of this code with separate color:

- image download (green),
- retries on fails (red),
- iteration through urls and result collection (blue).

As you can see, three colors are interleaved here. This hints that corresponding aspects are entangled. And by "entangled" I mean they can not be reused separately. Say we need retries on fails in some other place, we will probably end up copying the whole block and updating it somewhat. Not exactly the best practice "code reuse".

If, on the other hand, we managed to separate reties then our code will look like:

<figure class='code'><figcaption><span></span></figcaption><div class="highlight"><table><tr><td class="gutter"><pre class="line-numbers"><span class='line-number'>1</span>
<span class='line-number'>2</span>
<span class='line-number'>3</span>
<span class='line-number'>4</span>
<span class='line-number'>5</span>
<span class='line-number'>6</span>
<span class='line-number'>7</span>
</pre></td><td class='code'><pre><code><span class='red'>def retry(...):
    ...

http_retry = retry(DOWNLOAD_TRIES, HttpError)
</span><span class='green'>images</span> <span class='blue'>= []
</span><span class='blue'>for url in</span> <span class='green'>urls</span><span class='blue'>:
</span><span class='green'>    images</span><span class='blue'>.append(</span><span class='red'>http_retry(</span><span class='green'>download_image</span><span class='red'>)</span><span class='blue'>(url))
</span></code></pre></td></tr></table></div></figure>

Now red code is nicely grouped at the top. Green and blue are still mixed, but now they represent a pattern so common that most modern languages have a builtin function to handle that:

<figure class='code'><figcaption><span></span></figcaption><div class="highlight"><table><tr><td class="gutter"><pre class="line-numbers"><span class='line-number'>1</span>
<span class='line-number'>2</span>
<span class='line-number'>3</span>
<span class='line-number'>4</span>
<span class='line-number'>5</span>
</pre></td><td class='code'><pre><code><span class='red'>def retry(...):
    ...

http_retry = retry(DOWNLOAD_TRIES, HttpError)
</span><span class='green'>images</span> <span class='blue'>= map(<span class='red'>http_retry(</span><span class='green'>download_image</span><span class='red'>)</span><span class='blue'>, <span class='green'>urls</span><span class='blue'>)
</span></code></pre></td></tr></table></div></figure>

This last variant has some lovely traits: each part of a task at hand (downloading images) appear only once, the whole iteration aspect is handled with a single `map()` call and retries are abstracted out into [the retry function][retry].

Extracting common behavior into a higher order functions is a first trick underscore and funcy use to make your life better.


## Hiding low level

It's time to go back to second example. I'll throw away error handling to make snippets more even:

``` python
# Using function
walk_values(int, request)

# Using dict comprehension
{k: int(v) for k, v in request.items()}
```

Now they are both one-liners, so how is first one better? Let's identify every single distinct component of each code variant:

<figure class='code'><figcaption><span></span></figcaption><div class="highlight"><table><tr><td class="gutter"><pre class="line-numbers"><span class='line-number'>1</span>
<span class='line-number'>2</span>
<span class='line-number'>3</span>
<span class='line-number'>4</span>
<span class='line-number'>5</span>
</pre></td><td class='code'><pre><code class='python'><span class='line'><span class="c"># 3 components</span>
</span><span class='trend3'>walk_values(</span><span class='trend4'>int</span><span class='trend3'>,</span> <span class='trend8'>request</span><span class='trend3'>)
</span><span class='line'>
</span><span class='line'><span class="c"># 8 or so components</span>
</span><span class='line'><span class='trend3'>{</span><span class='trend0'>k</span><span class='trend3'>:</span> <span class='trend4'>int(</span><span class='trend6'>v</span><span class='trend4'>)</span> <span class='trend9'>for</span> <span class='trend0'>k</span><span class='trend7'>,</span> <span class='trend6'>v</span> <span class='trend9'>in</span> <span class='trend8'>request</span><span class='trend5'>.items()</span><span class='trend3'>}
</span></code></pre></td></tr></table></div></figure>

The second one looks like rainbow. But besides looking nice this means each time you write or read it you need to load all those components into your head, taking up all your cognitive resources. This is how first line is better.

That could be highlighted in even more obvious manner:

<figure class='code'><figcaption><span></span></figcaption><div class="highlight"><table><tr><td class="gutter"><pre class="line-numbers"><span class='line-number'>1</span>
<span class='line-number'>2</span>
<span class='line-number'>3</span>
<span class='line-number'>4</span>
</pre></td><td class='code'><pre><code class='python'><span class='trend3'>walk_values(int, request)
</span><span class='line'>
</span><span class='line'><span class="c"># red are low-level details</span>
</span><span class='line'><span class='trend3'>{</span><span class='trend8'>k</span><span class='trend3'>: int(</span><span class='trend8'>v</span><span class='trend3'>)</span> <span class='trend8'>for k, v in</span> <span class='trend3'>request</span><span class='trend8'>.items()</span><span class='trend3'>}
</span></code></pre></td></tr></table></div></figure>

This way we can see that about a half of the second line is low-level details. And low-level mean you don't need to know all those details to understand what's going on.

Hiding low-level details is the second way such libraries make your life better.


## Enriching our language

I'll translate the last example into natural language:

``` python
prev = None
for x in seq:
    if prev is not None and x <= prev:
        is_ascending = False
        break
    prev = x
else:
    is_ascending = True
# Starting with empty prev, iterate over seq, bookkeeping prev actuality,
# on each cycle if prev is present and current element is less or equal than it
# then set is_ascending to False and break.
# If loop wasn't broken set is_ascending to True

is_ascending = all(l < r for l, r in pairwise(seq))
# set is_ascending to all left elements being smaller than right
# in adjacent pairs of seq
```

Obviously, more code emits more text. Higher level code generates an explanation utilizing higher level abstractions. This way we can use bigger building blocks not only in coding, but in problem solving.

And this is the third way _ makes your life better.


## Wrap-up

All the things we came through are completely language independent. So there gotta be underscore for every language? Not quite, and more importantly a straight-forward port is not always a great idea: common behaviors to abstract vary per language and especially per application. The right approach would be to follow core ideas. Or look around if someone have already done that.

Here are some leads for you to take:

Language    | Libraries
---         | ---
JavaScript  | [Array][], [Function][], [Underscore][], [lowdash][]
Python      | [itertools][], [functools][], [funcy][], [toolz][], [fn.py][]
Ruby        | [Enumerable][], [ActiveSupport][]
PHP         | [functional-php][], [Underscore.php][]
Clojure     | [clojure.core][]
Java        | [FunctionalJava][]
C#          | [LINQ][]
Objective-C | [Underscore.m][]

**P.S.** You may also want to look at [Scala][] if you are using JVM and at [F#][] if it's .NET.

**P.P.S.** Please stop commenting on Hacker News, a controversial penalty is killing this post. Use [reddit thread](http://www.reddit.com/r/programming/comments/28se2h/why_every_language_needs_its_underscore/) instead. Sadly, HN is not a place for discussions anymore.


[acf]: http://hackflow.com/blog/2013/10/08/abstracting-control-flow/

[pairwise]: http://funcy.readthedocs.org/en/latest/seqs.html#pairwise
[retry]: http://funcy.readthedocs.org/en/latest/flow.html#retry


[Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/prototype
[Function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/prototype
[underscore]: http://underscorejs.org/
[lowdash]: http://lodash.com/

[itertools]: https://docs.python.org/2/library/itertools.html
[functools]: https://docs.python.org/2/library/functools.html
[funcy]: https://github.com/Suor/funcy
[toolz]: https://github.com/pytoolz/toolz
[fn.py]: https://github.com/kachayev/fn.py

[Enumerable]: http://www.ruby-doc.org/core/Enumerable.html
[ActiveSupport]: http://guides.rubyonrails.org/active_support_core_extensions.html

[functional-php]: https://github.com/lstrojny/functional-php
[Underscore.php]: https://github.com/brianhaveri/Underscore.php

[clojure.core]: http://richhickey.github.io/clojure/clojure.core-api.html
[FunctionalJava]: http://functionaljava.org/
[LINQ]: http://msdn.microsoft.com/ru-ru/library/bb397926.aspx
[Underscore.m]: http://underscorem.org/

[Scala]: http://www.scala-lang.org/
[F#]: http://www.tryfsharp.org/
