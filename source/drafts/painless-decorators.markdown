---
layout: post
title: "Painless Decorators"
comments: true
published: false
categories: [Python]
---

I assume you all understand a value of decorators.

This post is for those who enjoy using decorators and hate writing them.

Oh, wonderful decorators, if only they were easier to write.


I want to be clear, this is not a decorators tutorial, this one is for those who have written enough of them to feel pain typing another `def wrapper(...)`.


## Current state

Currently in a decorator you need to create a wrapper, update it's metadata and then return it.
A typical pattern would be:

``` python
from functools import wraps

def some_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        # ... do something before
        result = func(*args, **kwargs)
        # ... do something before
        return result
    return wrapper
```

And if you want decorator with arguments it becomes even harder:

``` python
def some_decorator(before, after):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            before()
            result = func(*args, **kwargs)
            after()
            return result
        return wrapper
    return decorator
```

Look at that code for a minute. What a mess! And this is not about typing, it's really hard to see through to the point of it.

Let's see what is meaningful and what is a boilerplate here. What we care about is concentrated in `wrapper` function, it's `before` and `after` calls, how they surround original function call, what arguments are passed to it and what is returned. The name `some_decorator` and its arguments also matter. Anything else - nested functions and returns, `@wraps` and all extra indent - is just code pattern waiting [to be abstracted][acf].

[acf]: http://hackflow.com/blog/2013/10/08/abstracting-control-flow/


## Removing a boilerplate

What we probably want to see (or write) is some flat syntax with code showing only wrapper semantics. Something like:

``` python
def some_decorator(...):
    # ... do something before
    result = func(*args, **kwargs)
    # ... do something before
    return result
```

Obviously `func`, `args` and `kwargs` should come from somewhere as well as all the magic turning plain function into decorator:

``` python
@decorator # apply magic
def some_decorator(func, args, kwargs):
    # ... do something before
    result = func(*args, **kwargs)
    # ... do something before
    return result
```


You can also do something with arguments passed or result value.


An easy way to create decorators. Here is a simple logging decorator::

``` python
    @decorator
    def log(call):
        print call._func.__name__, call._args, call._kwargs
        return call()
```


``` python
    @decorator
    def log(call):
        print call._func.__name__, call._args, call._kwargs
        return call()
```

`call` object also supports by name arg introspection and passing additional arguments to decorated function:

``` python
    @decorator
    def with_phone(call):
        # call.request gets actual request value upon function call
        phone = Phone.objects.get(number=call.request.GET['phone'])
        # phone arg is added to *args passed to decorated function
        return call(phone)

    @with_phone
    def some_view(request, phone):
        # ... some code using phone
        return # ...
```

You can easily create decorators with arguments too:

``` python
    @decorator
    def joining(call, sep):
        return sep.join(imap(sep.__class__, call()))
```

Usage example shown in :func:`joining` docs.

You can see more examples in :mod:`flow` and :mod:`debug` submodules source code.

