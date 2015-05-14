---
layout: post
title: "Metaprogramming Beyond Decency: Part 1"
date: 2015-03-29 20:08
comments: true
sharing: true
categories: [Python]
reddit_url: http://www.reddit.com/r/programming/comments/30p2zw/python_metaprogramming_beyond_decency/
---

*(This an adaptation of a talk I gave at PiterPy. [Slides](http://hackflow.com/slides/metaprogramming/) and [video](http://www.youtube.com/watch?v=Q8qxeFGNT9A) are available in russian)*

Python gives us deep introspecting and metaprogramming capabilities including bytecode and AST support in the standard library. This facilitates unobvious ways to write code that writes code or otherwise alters its behavior. I will show several different examples of how it could be used for
fun and profit.

<!--more-->


## Warming up

Look at this code:

```python
>>> map(_ + 1, [1, 2, 3])
[2, 3, 4]
```

It maps a list through `_ + 1` and gets a new list with each element incremented.
This makes sense mnemonically, but can this code actually work in python?

And sure it can. In fact this is rather simple trick with operator overloading:

```python
class Whatever(object):
    def __add__(self, y):
        return lambda x: x + y

_ = Whatever()
```

Here we create a class that produces lambda upon addition and then creates its instance named `_`.
Just using common interface in an unusual way. We can even go all loose and make something like this to work:

```python
# Sort guys by height descending
sort(guys, key=-_.height)

# Reduce my multiplication
factorial = lambda n: reduce(_ * _, range(2, n+1))
```

Returning lambda, obviously, won't work anymore. However, we can return a callable object,
which also returns callables as operations results. We are also intercepting attribute access here,
shouldn't surprise you after everything you've seen.

Honestly, I was too shy to use this in production. And you usually need only one or two lambdas in a file anyway, too few to bring an import, a dependency and all the complications.
But suppose you are writing [tests for functional support library][funcy-tests],
then you'll need to create lots of small functions to pass them to your ones.
A library like this would be useful in that setting.

Anyway, if you still think this idea is too weird then you should know that there are at least 3 libraries implementing it:

- [whatever][]
- [placeholder][]
- [fn.py][]

But let's move to something more interesting.


## Pattern Matching

Now look at this and think if it is also feasible in python.
This is supposed to recursively calculate a product of all the list elements:

```python
def product():
    if []: 1
    if [x] + xs: x * product(xs)
```

If you familiar with pattern matching then the code makes sense:

- product is 1 for empty list,
- product is (first element) times (product of the rest of the list) otherwise.

On the other hand, python doesn't work this way. `x` and `xs` are never defined and `product()` has no arguments. And yes, this really doesn't work. This, however, does:

```python
from patterns import patterns

@patterns
def product():
    if []: 1
    if [x] + xs: x * product(xs)
```

`@patterns` here rewrites function into something we meant. It can't obviously be implemented as ordinary decorator, since calling original function will crash. So `@patterns` reads function code instead, parses it into abstract syntax tree, transforms that to a meaningful one and then compiles back:

{% blockquote %}
Code  →  AST  →  New AST  →  New Code
{% endblockquote %}
<!-- TODO: make it pretty -->

And after transformation we get something like:

```python
def product(value):
    if value == []:
        return 1
    if isinstance(value, list) and len(value) >= 1:
        x, xs = value[0], value[1:]
        return x * product(xs)
```

Which looks like normal python code, it is also much more verbose.
That's why we got into this whole pattern matching thing in the first place.

And again it was too awkward to use all this magic in production code,
but I used code inspired by that:

```python
# Use simple pattern matching to construct form field widget
TYPE_TO_WIDGET = (
    [lambda f: f.choices,           lambda f: Select(choices=f.choices)],
    [lambda f: f.type == 'int',     lambda f: TextInput(coerce=int)],
    [lambda f: f.type == 'string',  lambda f: TextInput()],
    [lambda f: f.type == 'text',    lambda f: Textarea()],
    [lambda f: f.type == 'boolean', lambda f: Checkbox(f.label)],
)
return first(do(field) for cond, do in TYPE_TO_WIDGET if cond(field))
```

This actually could be useful for many things: recursive functions, chatbots, binary protocol implementations and other occasions when you resolve to long if-elses or switch-cases.
The general idea, however, comes beyond pattern matching.


## AST Applications

This technique -- abstract syntax tree transformation -- is much more broadly useful.
And the main reason is that trees capture language structure. Another trees virtue is that they are data structures, which are much more hackable than code strings.

Anyway, these are some things they facilitate:

**Language extensions.** With pattern matching being only one of them. Other examples are optional (or not) static typing, macros, ... It is only limited by your imagination and tree transformation skills. You obviously need to stay within syntax though, unless you go for separate parser and AST, but this is a separate topic.

**Optimizations**. This is less obvious but we can inline calls, precalculate constant expressions, even make tail call optimization.

**Code analysis**. It's much easier to analyze tree than just code string 'cause it captures some of semantics of a language. We can implement some linters or editor plugins with the help of AST.
Generally you won't need to transform a tree for analysis, but imagine some linter suggesting code changes specific to your particular fragment not general advice. That would be cool.

**Translation**. To JavaScript to run things in browser, to SQL to automatically generate queries
or stored procedures, to Python 3 after all.

These are various ways it flows:

{% blockquote %}
Code  →  AST  →  New AST  →  New Code
Code  →  AST  →  JavaScript
Bytecode  →  AST  →  SQL
{% endblockquote %}
<!-- TODO: make a flowchart? -->

Looks like we need to dig a bit more into AST.


## AST

First we need a way to get a tree. The easiest way is to first get source and then parse it. Two standard modules will help us with that:

```python
import inspect, ast

source = inspect.getsource(func)
tree = ast.parse(source)
```

Sometimes you can't get function source, most common example -- `inspect.getsource()` doesn't work with lambdas. Then you can still get to AST by decompiling bytecode:

```python
from meta.decompiler import decompile_func

tree = decompile_func(lambda x: x + 1)
```

We are using third party module [meta][] here, and despite saying that we decompile function it really does inspect and decompile its bytecode. Anyway, we've got our AST, let's look at it:

<img src="/slides/metaprogramming/ast-example.dot.svg" style="width: 100%">

This is quite a hairy tree for something as simple as `lambda x: x + 1`. But if we look at it a bit
more closer we can recognize all the corresponding parts. Left branch is arguments, which have single argument named `x`, but no kwarg, vararg or defaults. Right branch is a return node returning a result of binary operation with an op of addition and operands of a name `x` and a number `1`.

That makes sense, this is not however what we see as a result in python REPL:

```python
>>> tree
<_ast.Lambda at 0x7f7e2359e490>
```

Yeah, it's just a `Lambda` object. We can look up its attributes to get other nodes:

```python
>>> tree.body
<_ast.Return at 0x7f3e75f869d0>
```

And this is what python AST actually is: a collection of objects stored in the attributes of each other. In addition I need to say that this objects don't really have behaviour, they are just data.
You can find full list of available nodes and their attributes in [ast module][ast] documentation.

Inspecting AST this way could be too tiresome, we need some way to get a bigger picture.
The simplest thing we have is `ast.dump()` utility:

```python
>>> print ast.dump(tree)
Lambda(args=arguments(args=[Name(id='x', ctx=Param())], vararg=None, kwarg=None,
defaults=[]), body=Return(value=BinOp(left=Name(id='x', ctx=Load()), op=Add(),
right=Num(n=1))))
```

This is the same thing we saw in the picture, it is also useless for any non-trivial case. One more
third-party library, [astor][], could help us out:

```python
>>> print astor.dump(tree)
Lambda(
    args=arguments(args=[Name(id='x')], vararg=None, kwarg=None, defaults=[]),
    body=Return(value=BinOp(left=Name(id='x'), op=Add, right=Num(n=1))))
```

The same plus indents. It is already useful when you need to look at the AST closer, but for quick print debugging python code would be even better:

```python
>>> print astor.to_source(tree)
(lambda x: (x + 1))
```

Parentheses are added everywhere to avoid dealing with operator precedence, but otherwise it's the same code we parsed.

And the last thing we usually do to AST -- compile it back and execute:

```python
code = compile(tree, '', 'exec')
context = {}
exec(code, globals(), context)
```

Functions used here, `compile()` and `exec()`, are built-ins. And `code` is the same object type you can find introspecting `func.__code__`. By executing in a context we set all the names defined into that dict:

```python
>>> context
{'func': <function __main__.func>}
```

So if all these were happening in a decorator we can get that function out of the context and substitute original one. Only the meat is left -- walking the tree.


## AST Traversal

Built-in ast module continues to aid us in this journey. It provides several utilities to ease tree walking and transformation. The lower level ones let us introspect nodes contents and iterate by them:

```python
# Iterate fields with values
>>> ast.iter_fields(tree)
[('args', <_ast.arguments at ...>),
 ('body', <_ast.Return at ...>)]

# Iterate child nodes
>>> ast.iter_child_nodes(tree)
[<_ast.arguments ...>, <_ast.Return ...>]

# Just list available fields
>>> tree._fields
('args', 'body')
```

First of higher level ones is `NodeVisitor` -- a base class implementing visitor pattern, the idea is to subclass it and define methods like `visit_<NodeClass>()`:

```python
class NumberFinder(ast.NodeVisitor):
    def visit_Num(self, node):
        print "Found number literal", node.n

def find_numbers(tree):
    NumberFinder().visit(tree)
```

This simple example finds all the number literals in given code. Just an example, but it could be grown into some magic number finding tool and wrapped into linter or code editor plugin.

The second base class ast provides is `NodeTransformer`. It works almost the same, but you can change a tree by returning new nodes from visit methods:

```python
class ExprOptimizer(ast.NodeTransformer):
    def visit_BinOp(self, node):
        # Call .generic_visit() to transform sub-nodes
        node = self.generic_visit(node)
        # If both operands are just numbers then precalculate
        if type(node.left) is Num and type(node.right) is Num:
            op = AST_TO_OP[node.op.__class__]
            return Num(n=op(node.left.n, node.right.n))
        else:
            return node

AST_TO_OP = {
    Add: operator.add,
    ...
}
```

This one precalculates any expressions on number literals, quite neat for just a bunch of lines.

And last but not least we can use old and good recursive tree walking. This snippet makes python function return last expression in a way Ruby, CoffeScript and Clojure do:

```python
def return_last(tree):
    if not hasattr(tree, 'body'):
        return
    elif isinstance(tree.body[-1], Expr):
        tree.body[-1] = Return(value=tree.body[-1])
    else:
        return_last(tree.body[-1])
```

Note this code is simplified and hence broken, e.g. it will insert `return` into the end of while loop if there is an expression there.


## Going Forward

This was an overview of what you can do with AST, and there were lots of things. This is, however, only a preface to the actual story. Next time I will concentrate on translation and will describe it in detail capturing a real use case.

**P.S.** Second part is available [here](/blog/2015/04/12/metaprogramming-beyond-decency-part-2/).


[slides]: http://hackflow.com/slides/metaprogramming/

[funcy-tests]: https://github.com/Suor/funcy/blob/master/tests/test_funcs.py
[whatever]: https://github.com/Suor/whatever
[placeholder]: https://pypi.python.org/pypi/placeholder
[fn.py]: https://github.com/kachayev/fn.py

[meta]: https://github.com/srossross/Meta
[ast]: https://docs.python.org/2/library/ast.html
[astor]: https://github.com/berkerpeksag/astor
