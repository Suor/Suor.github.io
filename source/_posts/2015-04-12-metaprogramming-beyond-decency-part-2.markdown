---
layout: post
title: "Metaprogramming Beyond Decency: Part 2"
date: 2015-04-12 18:41
comments: true
sharing: true
image: http://hackflow.com/images/metaprogramming/rule-tree.dot.png
categories: [Python, UI]
reddit_url: http://www.reddit.com/r/programming/comments/32bp3p/practical_python_to_javascript_translation/
---

*(This is second part of my PiterPy talk adaptation, first part is available [here][first-part])*


Previously I described various ways AST could be used to alter Python language. Now I will concentrate on translation, and we will translate Python to JavaScript.

<!--more-->


## Translation

Unlike all Part 1 examples this one started from real need, the one as mundane as form validation:

<img src="/images/metaprogramming/car-form.png" style="display: block; margin: 0 auto">

Here we have a form with a validation error visible, we typically want this to be shown as soon as possible, so we implement these checks in browser in JavaScript. But we still need to check everything on the server to not let broken data into our database.

Usually we just duplicate logic and this works. Until we get many forms and all of them are like this:

<img src="/images/metaprogramming/car-form-full.png">

When we arrive to this scale code duplication starts to cause problems duplication always does:
some things are checked only in one place, some things are not updated accordingly and contradict each other. We show weird errors to our users and save broken data to our database.

In ideal world we wish to write every rule just once and then use it in both environments:

```python
# Clean raw value
clean = lambda x: int(re.sub(r'\s+', '', x))

# Validate clean value
validate = lambda x: 1000 <= x < 100000000
```

So we naturally came to translation. We want to write validation in python, translate it to JavaScript and use on front-end automatically.


## The Easy Part

Let's start from something simple, like translating a plain lambda like this:

```python
>>> translate(lambda v: v <= 100)
```

We will use AST to for translation, so first we need to get it for this lambda. It's hard to get source for lambda to parse it, so we'll use [meta][] library to decompile its bytecode:

```python
from meta.decompiler import decompile_func

tree = decompile_func(lambda v: v <= 100)
```

Once we do that we get a tree like this:

<img src="/images/metaprogramming/rule-tree.dot.svg" style="display: block; margin: 0 auto">

I simplified it to look prettier, but all significant aspects are still here.

The easiest way to render it to a new language is to start from leaves: numbers, variable names and operators mostly look the same in JavaScript. We will employ `ast.NodeVisitor` to walk the tree:

```python
class Translator(ast.NodeVisitor):
    def visit_Num(self, node):
        node.js = str(node.n)

    def visit_Name(self, node):
        node.js = 'null' if node.id == 'None' else node.id

    def visit_LtE(self, node):
        node.js = '<='
```

After using this we come to:

<img src="/images/metaprogramming/translation-1.dot.svg" style="display: block; margin: 0 auto">

When leaf nodes are done we can compile code for ones depending on them:

```python
def visit_Compare(self, node):
    # Visit sub-nodes
    self.generic_visit(node)
    # Concatenate sub-node parts,
    # use parentheses to not worry about operator precedence
    node.js = '(%s %s %s)' % (node.left.js, node.op.js, node.right.js)
```

And we've got to:

<img src="/images/metaprogramming/translation-2.dot.svg" style="display: block; margin: 0 auto">

We can continue going up the tree and finally get:

```python
>>> translate(lambda v: v <= 100)
function (v) {
    return (v <= 100)}
```

Yay! We did it. But...


## Complications

What about translating code like:

```python
1 <= x < 10
```

There is no chained comparisons in JavaScript, the best we can do is translating this to:

```js
(1 <= x) && (x < 10)
```

There is also no `not in` operator in JavaScript, combining all that `Compare` translation complicates to (not necessary to read and understand all this, just appreciate the complication):

```python
def visit_Compare(self, node):
    self.generic_visit(node)

    ops = node.ops
    operands = [node.left] + node.comparators
    pairs = pairwise(operands)  # adjacent pairs of operands

    node.js = ' && '.join('%s(%s %s %s)' % \
        ('!' if isinstance(op, ast.NotIn) else '',
            l.js, op.js, r.js)
        for op, (l, r) in zip(ops, pairs))
```

Another complication is keyword arguments and star arguments. We can deal with them by complecting our code even more or by refusing to handle this case at all:

```python
def visit_Call(self, node):
    assert node.kwargs is None \
        and node.starargs is None
    # ...
```

Now we are translating only subset of Python, but this should be okay since translation is not our goal, it's code deduplication for validation rules. So as long as translator works for this particular use case we are fine.


## Closures

We are still not done yet. We probably don't want to write same validation rules over and over,
so we will end with code like:

```python
>>> up_to = lambda limit: lambda v: v <= limit
>>> translate(up_to(50))
function (v) {
    return (v <= limit)}
```

It's easy to see that `limit` in JavaScript code refers to non-existing variable. To fix that we need to introspect values enclosed within a function, thankfully Python introspection has our back:

```python
>>> u50 = up_to(50)
>>> u50.__closure__
(<cell at ...: int object ...>,)
```

Here the closure is a tuple containing single cell with an int object in it. Makes sense since we are enclosing `50`. It's fairly easy to get cell contents:

```python
>>> [cell.cell_contents
      for cell in u50.__closure__]
[50]
```

It's also easy to introspect free variables refering to enclosed values:

```python
>>> u50.__code__.co_freevars
('limit',)
```

This `co_freevars` always have the same length and order as cells in closure, so we can pair them up and translate the whole thing to:

```js
(function (){
    var limit = 50;

    return function (v) {
        return (v <= limit)}
}())
```

So we've got a closure. This highlights how we are not really translating functions, but closures,
which are functions plus context.


## More Closures

Unfortunately `func.__closure__` doesn't capture everything, any global names and built-ins are still uncovered. Let's translate this one:

```python
len50 = lambda s: len(s) <= 50
```

We can access function globals and built-ins namespaces with:

<div class="break-code">
```python
>>> len50.__globals__
{'len50': <function <lambda> at 0x7f705a92a848>, '__builtins__': <module '__builtin__' (built-in)>, 'dis': <module 'dis' from '/usr/lib/python2.7/dis.pyc'>, 'translate': <function js.translate>, 's': '\n<section>\n<pre><code class="python">>>> [cell.cell_contents\n...'

>>> __builtin__.__dict__
{'bytearray': <type 'bytearray'>, 'IndexError': <type 'exceptions.IndexError'>, 'all': <built-in function all>, 'vars': <built-in function vars>, 'SyntaxError': <type 'exceptions.SyntaxError'>, 'isinstance': <built-in function isinstance>, 'copyright': Copyright (c) 2001-2014 Python Software Foundatio...
```
</div>

So we only need to detect global names used by a function. We could have walked the AST, but then we would need to separate local and enclosed non-local names from global ones. The easier way is to introspect bytecode, which looks like this:

```python
>>> len50.__code__.co_code
't\x00\x00|\x00\x00\x83\x01\x00d\x01\x00k\x01\x00S'
```

Just a binary string, not that pretty. But python standard library provides us [dis][] module to handle that:

```python
>>> dis.dis(len50)
1       0 LOAD_GLOBAL         0 (len)
        3 LOAD_FAST           0 (s)
        6 CALL_FUNCTION       1
        9 LOAD_CONST          1 (50)
       12 COMPARE_OP          1 (<=)
       15 RETURN_VALUE
```

The thing to see here is `LOAD_GLOBAL` instruction, it corresponds to global variable use. `dis` module only prints bytecode nicely, but doesn't let us really in. So we go for another asset -- [byteplay][]:

```python
from byteplay import Code, LOAD_GLOBAL

# Wrap code into byteplay object
code = Code.from_code(f.__code__)

# Iterate over instructions and collect names
names = {param for cmd, param in code.code
               if cmd == LOAD_GLOBAL}
```

So we collected all refered global names, we can translate them unless they are implemented in C.
To handle that we can supply a dict like:

```python
BUILTINS = {
    ...
    len: lambda s: s.length,
    ...
}
```

With code which doesn't make sense in Python. However, it will make sense after translation:

```python
>>> translate(lambda s: len(s) <= 50)
(function (){
    var len = function (s) {return s.length};

    return function (s) {
        return (len(s) <= 50)}
}())
```

Actually we could have used strings in `BUILTINS` dict, but with lambdas we can refer to other things in our implementations:

```python
BUILTINS = {
    ...
    identity: lambda x: x,
    all: lambda seq: seq.every(identity),
    ...
}
```

Which enables us to make things like:

```js
(function (){
    var all = (function () {
            var identity = function (x) {
                return x};

            return function (seq) {
                return seq.every(identity)}
        }()),
        len = function (s) {return s.length};

    return function (xs) {
        return ((len(xs) >= 1) && all(xs))}
}())
```

Here `all()` is defined as a nested closure. Also the whole thing starts to look complex.
Fortunately we don't need to write this, we don't even need to read this, we only deal with
python lambdas. And that one is just a single line for the mess above:

```python
lambda xs: len(xs) >= 1 and all(xs)
```


## Meeting Halfway

We've already come a long way, however, some things still won't work:

```python
# Does't work, it's s.trim() in JavaScript
lambda s: s.strip()
```

To fix this we will need to write shims for all python types and convert everything before passing to our function. This sounds like a lot of work, so went another way -- just don't write like that, write this way instead:

```python
# Does work if "string" is in BUILTINS
lambda s: string.strip(s)
```

Look, system does many things to make everything work, now we can come along and finally meet halfway. This approach worked wonderfully for us, we managed to get practical solution with:

- no runtime,
- no shims,
- only 300 lines of code.

Compare this to full-blown python to js translator. Anyway let's see what it have brought to us.


## Demos

Here is how validation looks. It updates as we type and wholly executed in the browser:

<img src="/images/metaprogramming/demo-validation.gif" style="display: block; margin: 0 auto">

And we don't write any JavaScript to achieve that. We write this instead:

```python
class PriceField(FlexField):
    clean = lambda v: int(re.sub('\s+', '', v))
    rules = [
        [lambda t: re_test(r'^[\s\d]*$', t), 'Enter a number'],
        [lambda v: v < 100000000, 'Specify adequate price'],
        [lambda v: v >= 1000, 'Specify price in rubles, ...'],
    ]
```

This works both in browser and server-side so we don't need to duplicate logic or messages. Also having lots of similar fields we can reuse everything: fields, predicates, cleanup functions, rules, which are just lambdas plus text messages. So it really looks like:

```python
class PriceField(FlexField):
    clean = clean.posint
    rules = [
        rule.posint,
        [test.lt(100000000), 'Specify adequate price'],
        [test.ge(1000), 'Specify price in rubles, ...'],
    ]
```

We can also employ inheritance:

```python
class PriceField(PosIntegerField):
    rules = ...
```


### Computed Properties

We really got more from this system than just validation. And first thing to show is computed properties. These are visibility, labels, choices and more. I'll demo it with another tiny screencast:

<img src="/images/metaprogramming/demo-visibility.gif" style="display: block; margin: 0 auto">

Here we can see several aspects -- when user selects "exchange to a car" a new drop-down appears,
and when a label changes depending on who pays extra. Here is how it looks in code:

```python
class ExtraPaymentField(FlexField):
    # Relabel depending on who pays extra
    label = lambda self: ('Max' if self.exchange_terms = MY_EXTRA else 'Min') \
                         + ' extra payment'
    # Show if there is an extra payment involved
    visible = lambda self: self.exchange_terms != NO_EXTRA
```

Additional benefit we get here is that we can compute visibility server-side and do 2 things: first, render a form in an appropriate state from the start (less flickering in the browser) and, second, discard any input we got from invisible fields automatically. Another example of additional benefit is calculated choices, able to get them on back-end we can check if value is one of them.

Other thing to note is that now we have dependencies, e.g. label text and visibility depends on `exchange_terms` field value. We could have added some tricky introspection, but we instead required programmers to specify dependencies explicitly:

```python
class ExtraPaymentField(FlexField):
    @depends('exchange_terms')
    def visible(self):
        return self.exchange_terms != NO_EXTRA
```

This is in line with our meeting halfway principle and it worked this time too.


### Passing Data

The last demo for today will show how easily we can pass data to client. Here I show how field values could be automatically selected:

<img src="/images/metaprogramming/demo-autoselect.gif" style="display: block; margin: 0 auto">

To look through car models we need to pass their list to browser and we can do this simply by enclosing data structure with a function:

```python
models = CarModel.objects.values_list('pk', 'title')

value = lambda self: first(pk for pk, title in models
                              if self.lookup in title)
```

This lambda uses `models` so they are translated to JavaScripts array of arrays and passed along with function. This is very handy when, for example, creating chained selects and under many other circumstances.


## The Bigger System

You probably already noticed that there is a bigger system besides translator here. These are all its parts:

- declarative descriptions of fields, models, forms, filters, listings and detail pages,
- translation of clean, validate and property compute functions,
- transparent data forwarding.

There is the thing with tools that when you introduce some new very useful one you get a whole lot of new possibilities, you can make much faster something that took ages previously or you can even do things, which were impossible before.

This also works for developer tools. Introduction of this system had led to a population boom -- we've got from 7 forms to 51, and you can double that number 'cause we also autogenerate filtering form for each of them. We also got to 500+ database tables. All of this without loosing our sanity or growing our code base to some insane LOC number.


## Decency

In python world we have this stigma on metaprogramming. Like it's dirty and should not be used in any serious setting. It's true that this is a complex technique that brings its costs. But as any other consideration this has its limits.

By promoting reasonable considerations to emotional and even kind of religious level we loose an ability to judge it mindfully. We dismiss something even before considering it seriously. And doing so we miss great solutions.

This worked for us. What will do for you?


[first-part]: http://hackflow.com/blog/2015/03/29/metaprogramming-beyond-decency/

[dis]: https://docs.python.org/2/library/dis.html
[meta]: https://github.com/srossross/Meta
[byteplay]: https://pypi.python.org/pypi/byteplay
