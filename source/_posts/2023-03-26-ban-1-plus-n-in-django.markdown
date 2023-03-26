---
layout: post
title: "Ban 1+N in Django"
comments: true
date: 2023-03-26 15:00
categories: [CS, Python]
hn_id: 35313565
reddit_url: https://www.reddit.com/r/Python/comments/122kkrs/how_to_ban_1n_in_django/
---

I always thought of 1+N as a thing that you just keep in your head, catch on code reviews or via performance regressions. This worked well for a long time, however, the less control we have over our SQL queries the more likely it will sneak through those guards.

<!--more-->


## A small history dive

This used to be very visible and meant almost "do not perform SQL queries in a cycle":

```python
books = c.execute("SELECT id, title, author_id FROM books").fetchall()  # 1
for id, title, author_id in books:
    c.execute("SELECT full_name FROM authors WHERE id=?", [author_id])  # +N
```

With ORM and lazy loading this became a little bit less obvious:

```python
books = Book.objects.filter(...)  # 1
for book in books:
    print(f"Book title: {book.title}, author: {book.author.full_name}")  # +N
```

With something so innocent as an attribute access making an SQL query, it's much easier to miss it. Especially when this code spreads out, the ORM objects are passed to templates, which also have loops and sure they can do attribute access.

As project grows, as its database schema becomes more complicated, as your team grows too, this keeps adding up. And magic also adds up. One particular mention should be a GraphQL library, which resolves onto ORM automatically.


## Back to the present

I tumbled on a couple of 1+Ns while reading a project code for an unrelated reason and it got me thinking - do I ever want Django to do that lazy loading stuff? And the answer was never. This was a misfeature for me, the need for such thing is quite circumstantial, usually when you load a list of things you need the same data about all of them, so it doesn't make sense to lazy load extra data for each object separately. Either eager load or batch lazy load, the latter Django does not do.

So, anyway, if I don't need this than I might as well prohibit it, which turned out to be quite easy to do:

```python
from django.db.models.query_utils import DeferredAttribute


def _DeferredAttribute_get(self, instance, cls=None):
    if instance is None:
        return self
    data = instance.__dict__
    field_name = self.field.attname
    if field_name in data:
        return data[field_name]

    # Raise an exception to prevent an SQL query
    attr = f"{instance.__class__.__name__}.{field_name}"
    message = f"Lazy fetching of {attr} may cause 1+N issue"
    raise LookupError(message)

DeferredAttribute.__get__ = _DeferredAttribute_get
```

This way 1+N will blow up instead. Great, we'll catch it during tests. The thing is, however, if 1+Ns were passing our defences before they will probably continue now and this will explode in production. With this in mind, a flood guard and some explanations it transforms into:


```python
import logging
import os
from django.db.models.query_utils import DeferredAttribute

logger = logging.getLogger(__name__)
attrs_seen = set()


def _DeferredAttribute_get(self, instance, cls=None):
    from django.conf import settings  # monkeys go early, settings might not be available yet

    if instance is None:
        return self
    data = instance.__dict__
    field_name = self.field.attname

    # Normally this accessor won't be called if field_name is in __dict__,
    # we need this part so that DeferredAttribute descendants with __set__ play nice.
    if field_name in data:
        return data[field_name]

    # If it's not there already then prevent an SQL query or at least notify we are doing smth bad
    attr = f"{instance.__class__.__name__}.{field_name}"
    # Only trigger this check once per attr to not flood Sentry with identical messages
    if attr not in attrs_seen:
        attrs_seen.add(attr)
        message = f"Lazy fetching of {attr} may cause 1+N issue"
        # We stop in DEBUG mode and if inside tests but let production to proceed.
        # Using LookupError instead of AttributeError here to prevent higher level "handling" this.
        if settings.DEBUG or "PYTEST_CURRENT_TEST" in os.environ:
            raise LookupError(message)
        else:
            logger.exception(message)

    # Proceed normally
    return _DA_get_original.original(self, instance, cls)

_DA_get_original, DeferredAttribute.__get__ = DeferredAttribute.__get__, _DeferredAttribute_get
```

Which is ready to be used as is. Simply need to put or import it somewhere.

**P.S.** A small bonus - how I tried to [make ChatGPT write this post](https://gist.github.com/Suor/af424c3501792dba6fcf907506987571) for me. It was mostly failure :), but refactoring the code sample was done nicely.
