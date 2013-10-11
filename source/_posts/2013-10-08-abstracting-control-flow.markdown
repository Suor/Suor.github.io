---
layout: post
title: "Abstracting Control Flow"
date: 2013-10-08 12:13
comments: true
categories: [Functional Programming, Python]
hn_id: 6527441
---


Any programmer, even if she doesn't see it this way, constantly creates abstractions. The most common things we abstract are calculations (caught into functions) or behavior (procedures and classes), but there are other recurring patterns in our work, especially in error handling, resource management and optimizations.

Those recurring patterns usually involve rules like "close everything you open", "free resources then pass error farther", "if that succeeded go on else ...", which commonly look like repetitive `if ... else` or `try ... catch` code. How about abstracting all that control flow?

 <!--more-->

In conventional code, where nobody plays too smart, control structures do control flow. Sometimes they don't do that well and then we through in our own. That is simple in Lisp, Ruby or Perl, but is also possible in a way in any language featuring higher order functions.


## Abstractions

Let's start from the beginning. What do we do to build a new abstraction?

1. Select a piece of functionality or behavior.
2. Name it.
3. Implement it.
4. Hide our implementation behind chosen name.

Points 3-4 are not always possible. It depends very much on flexibility of your language and the piece you are trying to abstract.

In case your language can't handle it, skip implementation and just describe your technique, make it popular, giving birth to a new design pattern. This way you can continue writing repetitive code without feeling bad about it.


## Back to real-life

This is a piece of common python code, taken from real-life project with minimal changes:

``` python
urls = ...
photos = []

for url in urls:
    for attempt in range(DOWNLOAD_TRIES):
        try:
            photos.append(download_image(url))
            break
        except ImageTooSmall:
            pass # skip small images
        except (urllib2.URLError, httplib.BadStatusLine, socket.error), e:
            if attempt + 1 == DOWNLOAD_TRIES:
                raise
```

There are many aspects to this code: iterating over `urls`, downloading images, collecting images into `photos`, skipping small images and retries in case of download errors. All of them are entangled in this single piece of code, despite that they can be useful outside of this code snippet.

And some of them already exist separately. For example, iteration plus result gathering make `map`:

``` python
photos = map(download_image, urls)
```

Let's try fishing out other aspects, starting with skipping small images. That could be done like:

``` python
@contextmanager
def ignore(error):
    try:
        yield
    except error:
        pass

photos = []
for url in urls:
    with ignore(ImageTooSmall):
        photos.append(download_image(url))
```

Looks good. However this can't be composed with `map` easily. But let's put it off for now and deal with network errors. We can try abstracting it the same way we handled `ignore`:

``` python
with retry(DOWNLOAD_TRIES, (urllib2.URLError, httplib.BadStatusLine, socket.error)):
    # ... do stuff
```

Only that can't be implemented. Python `with` statement can't run its block more than once. We just ran against language constraint. It's important to notice such cases if you want to understand languages differences beyond syntax. In Ruby and to lesser extend in Perl we could continue manipulating blocks, in Lisp we could even manipulate code (that would probably be an overkill), but not all is lost for Python, we should just switch to higher order functions and their convenience concept - decorators:

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
photos = map(http_retry(download_image), urls)
```

As we can see, it even works with `map` naturally. And more than that, we got a pair of potentially reusable tools: `retry` and `http_retry`. Unfortunately our `ignore` context manager can't be easily added here. It's not composable. Let's just rewrite it as decorator:

``` python
@decorator
def ignore(call, errors=Exception):
    try:
        return call()
    except errors:
        return None

ignore_small = ignore(ImageTooSmall)
http_retry = retry(DOWNLOAD_TRIES, (urllib2.URLError, httplib.BadStatusLine, socket.error))
download = http_retry(ignore_small(download_image))
photos = filter(None, map(download, urls))
```


## How is this better?

Seems like we have more code now and it still involves all the same aspects. The difference is that they are not entangled anymore they are composed. Which means several things:

- every single aspect is visible,
- it's named,
- it can be taken out and brought back easily,
- it can be reused.

The essential code takes only 4 last lines and after getting used to functional control flow can probably become more readable. Or not, that's subjective. Still I hope this post will help somebody to write better code.


**P.S.** I packed `@decorator`, `ignore` and `retry` into [one practical library][funcy].

**P.P.S.** Other examples of control flow abstractions include: [function manipulations in underscore.js][underscore], list comprehensions and generator expressions, [pattern matching][patterns], [function overload][overload], caching decorators and much more.

[funcy]: https://github.com/Suor/funcy
[underscore]: http://underscorejs.org/#functions
[patterns]: https://github.com/Suor/patterns
[overload]: https://github.com/Suor/overload
