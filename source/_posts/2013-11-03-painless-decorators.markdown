---
layout: post
title: "Painless Decorators"
sharing: true
comments: true
date: 2013-11-03 20:07
categories: [Python]
hn_id: 6662926
reddit_url: http://www.reddit.com/r/Python/comments/1puzwp/painless_decorators/
---


Decorators are joy to use. Write? Not so much. One needs to mess with wrappers, function metadata and a fair amount of bookkeeping. Enough things to bury any useful semantics under them. There got to be a better way.

Let's find that out.

<!--more-->


## Current state

Currently in a decorator you need to create a wrapper, update it's metadata and then return it. You also need to pass arguments and result value in and out carefully. A typical pattern would be:


``` python
from functools import wraps

def some_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        # ... do something before
        result = func(*args, **kwargs)
        # ... do something after
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

Let's see what is meaningful and what is a boilerplate here. What we care about is concentrated in `wrapper` function, it's `before` and `after` calls, how they surround original function call, what arguments are passed to it and what is returned. The name `some_decorator` and its arguments also matter. Anything else - nested functions and returns, `@wraps` and all extra indent - is just [code pattern waiting to be abstracted][acf].


## Removing a boilerplate

What we probably want to see (or write) is some flat syntax with code showing only wrapper semantics. Something like:

``` python
def some_decorator(...):
    # ... do something before
    result = func(*args, **kwargs)
    # ... do something after
    return result
```

Obviously `func`, `args` and `kwargs` should come from somewhere as well as all the magic turning plain function into decorator. Suppose we have `@decorator` to handle the conversion and the easiest way to provide all values is just enclosing them as `some_decorator` arguments:

``` python
@decorator
def some_decorator(func, args, kwargs):
    # ... do something before
    result = func(*args, **kwargs)
    # ... do something after
    return result
```

Calling decorated function with the same arguments as its wrapper is a pattern so common that we should abstract that too. Also, our decorator may become too cluttered once we start adding its own arguments. To keep this clean we can substitute three call related arguments with a single `call` object:

``` python
@decorator
def some_decorator(call):
    # ... do something before
    result = call()
    # ... do something after
    return result
```

Looks simple and to the point. Something we were looking for. And once we have a clear view we can go ahead and implement the magic. Actually, you can [download it from pypi][funcy-pypi] right now and import it with `from funcy import decorator`.


## Advanced usage

We seemingly lost a couple of features in our quest for simplicity: access to call arguments, function itself, ability to call function differently and create decorators with arguments. But that's not the case really, we can pack all these into `call` object. I'll go through everything with better examples than you saw so far.


### Accessing function arguments

You didn't expect a post about decorators without logging example, did you? Anyway, it's an excellent way to show how you can access not only call arguments but decorated function itself:

``` python
@decorator
def log(call):
    print "Calling %s with args %s and kwargs %s"         \
        % (call._func.__name__, call._args, call._kwargs)
    return call()
```

As you can see, everything is underscore-prefixed, this is done to avoid clashes with function argument names, the values of which are binded to `call` object as attributes. Pretty handy if you are writing something more specific than logging decorator. Look at this simplified `login_required` decorator to get a foretaste:

``` python
@decorator
def login_required(call):
    if call.request.user.is_authenticated():
        return call()
    else:
        return redirect(LOGIN_URL)
```


### Altering calls

Is considered a bad practice cause it makes code harder to read. However, this could be useful occasionally and I am not into childproofing anyway. The obvious way to do it is just using plain function carefully stored in `call._func`:

``` python
@decorator
def int_args(call):
    """Coerces any function arguments to ints"""
    return call._func(*map(int, call._args))
```

But a common use-case of passing some extra data to function could be written with more elegance:

``` python
@decorator
def with_phone(call):
    phone = Phone.objects.get(number=call.request.GET['phone'])
    return call(phone) # phone is added to *args passed to decorated function

@with_phone
def some_view(request, phone):
    # ... some code using phone
```

This works with named arguments too, and is probably a better way since you won't run into problems with arguments order.


### Decorators with arguments

To get these you just add your arguments after `call` as in this [control flow abstracting][acf] retry decorator:

``` python
@decorator
def retry(call, tries, errors=Exception):
    for attempt in range(tries):
        try:
            return call()
        except errors:
            # Reraise error on last attempt
            if attempt + 1 == tries:
                raise
```


## Why use that?

There are obvious reasons: to reduce clutter and expose your intentions. However, there is usual cost. This as any abstraction brings an additional layer of complexity on top of python. And python could be seen as a layer on top of c, and that as one above asm, and that ...

You can choose for yourself what level is too high. And if python is sometimes not enough high level language for you then you should definitely upgrade it.


[acf]: http://suor.github.io/blog/2013/10/08/abstracting-control-flow/
[funcy-pypi]: https://pypi.python.org/pypi/funcy
