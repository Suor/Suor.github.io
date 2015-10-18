---
layout: post
title: "Asynchronous Operations"
comments: false
published: false
shared: false
categories: [CS]
---


In several recent years the concept of async programming has become popular. This is mostly related to the rise of Node.js, but supporting techniques also made their way to [Python][python-async], [Clojure][clojure-async], [.NET][dotnet-async] and more. Older asynchronous platforms became more popular and completely new ones now include this from the start.

Ways of doing async programming also gradually changed from simple callbacks to special syntactic support by various platforms. Here I want to lay out an overview of this path and relative wins and setbacks along it.

<!-- such technologies as Go, Erlang, Twisted, EventMachine, asyncio and more also contributed. There are a variety of approaches to async programming: callbacks, green threads,actors and CSP. -->

<!-- Async programming was a way to go if you need to support many concurrent connections for a while
Node.js introduced async programming to the masses
 -->

<!--more-->

... I will use JS, but many things apply to other platforms ...

[python-async]: https://docs.python.org/3/whatsnew/3.5.html#pep-492-coroutines-with-async-and-await-syntax
[clojure-async]: http://clojure.com/blog/2013/06/28/clojure-core-async-channels.html
[dotnet-async]: https://msdn.microsoft.com/en-us/library/hh191443.aspx


## Callbacks

It's the simplest way to do async programming. You make a call and supply a function to call you back then the thing is done:

```js
redis.get('some-key', function (err, someValue) {
    // ... do something with someValue ...
})
```

Often we can't do anything meaningful here until we get that `someValue`, in this case all the continuation of our program goes into that callback function we are passing to `redis.get()`. This is why such way of programming is sometimes called [continuation-passing style][cps].

Obviously, there are other ways to pass callback, results and errors. Here I use Node.js convention:

- callback goes as last argument to a call,
- error is passed as first callback argument,
- results go as any additional callback arguments.

This is a very tight way to go about this: errors and results are handled simultaneously and original call gets callback right away. I'll show later why this matters.


### Serial calls

Anyway, when we need to chain several calls we end up shifting right:

```js
redis.get('some-key', function (err, someValue) {
    redis.get('other-key', function (err, otherValue) {
        redis.set('sum', someValue + otherValue, function (err) {
            console.log('done');
        })
    })
})
```

This could obviously be solved by decomposition:

```js
function getSum(callback) {
    redis.get('some-key', function (err, someValue) {
        redis.get('other-key', function (err, otherValue) {
            callback(null, someValue + otherValue);
        })
    })
}

getSum(function (err, sum) {
    redis.set(sum, sum, function(err) {
        console.log('done');
    })
})
```

The issue with this is that it's verbose and not always desirable. We generally want to factor code into meaningful pieces, each of which has some sense in problem solution. We don't want to partition a chunk of code just because it's too long.

Another issue I happily left out till now is error handling. Since we get error and result in a single place we need to handle both there, even if this means just passing an error up:

```js
function getSum(callback) {
    redis.get('some-key', function (err, someValue) {
        if (err) return callback(err);

        redis.get('other-key', function (err, otherValue) {
            if (err) return callback(err);
            callback(null, someValue + otherValue);
        })
    })
}
```

This repetitive line keeps haunting async code written in this style. But let's move to parallel calls, that is why we use async platforms after all.


### Parallel calls

Those `redis.get()` calls don't need to be serial, so we can launch both of them in parallel like this:

```js
var someValue;
redis.get('some-key', function (err, _someValue) {
    someValue = _someValue;
});
// This second call is started right away
redis.get('other-key', function (err, otherValue) {
    console.log(someValue + otherValue);
});
```

This however won't work, `other-key` could be fetched before `some-key` and hence `someValue` in `console.log()` could be undefined. To fix this we will need some coordination code:

```js
// Keep track of number of things to do
var tasks = 2, someValue, otherValue;
function done() {
    tasks--;
    // Only use results when both are ready
    if (!tasks) console.log(someValue + otherValue);
}

redis.get('some-key', function (err, _someValue) {
    someValue = _someValue;
    done();
});
redis.get('other-key', function (err, _otherValue) {
    otherValue = _otherValue;
    done();
});
```

Note that I left out error handling and this is still messy. And obviously this can be (and should be) abstracted away.


<section class="note-box">

### A side note on CPS, just to make this section more fun

In the code above we pass continuations as functions, but some languages, notably [Scheme][scheme-callcc] and [Ruby][ruby-callcc] have syntactic support to literally pass continuation of your program:

```ruby
require "continuation"

some_value = callcc {|cont| redis.get('some-key', cont)}
# ... we only get here once redis.get() calls cont
other_value = callcc {|cont| redis.get('other-key', cont)}
# ... and here
callcc {|cont| redis.set('sum', some_value + other_value, cont)}
# ... sum is already written, do more stuff
```

We can go even farther and hide all those `callcc`s and blocks into redis calls and make code look identical to sync one:

```ruby
some_value = redis.get('some-key')
other_value = redis.get('other-key')
redis.set('sum', some_value + other_value)
```

This can be implemented by queueing continuation to resume on redis response and passing control to event loop. So looks like we got the best of both worlds here: simple syntax and efficiency.

This, however, will limit our power -- having such redis API we loose the ability to run calls in parallel:

```ruby
# TODO: check if this is correct ruby
callcc {|cont|
    tasks = 2
    done = proc {
        --tasks
        cont.call if tasks.zero?
    }
    redis.get('some-key', done)
    redis.get('other-key', done)
}
```

In real world `call-with-current-continuation` is far more powerful when I had time to show here.
It enables a brave one to implement from scratch all sort of wonderful and scary things: arbitrary loops with nesting and early exit, exceptions and their handling, generators, coroutines and more.

</section>

[cps]: https://en.wikipedia.org/wiki/Continuation-passing_style
[scheme-callcc]: http://community.schemewiki.org/?call-with-current-continuation
[ruby-callcc]: http://ruby-doc.org/core-2.2.0/Continuation.html


## Combinators

We saw how both serial and parallel calls could benefit from some general abstraction. And during earlier Node.js years there were lots of control flow libraries introduced. One that has grown to be the most popular is [async.js][], which lets you combine calls like this:

```js
var async = require('async');

async.series([
        function (callback) {redis.get('some-key', callback)},
        function (callback) {redis.get('other-key', callback)}
    ],
    function (err, results) {
        console.log(results[0] + results[1]);
    }
)
```

Or using partial application:

```js
async.series([
        redis.get.bind(redis, 'some-key'),
        redis.get.bind(redis, 'other-key')
    ],
    function (err, results) { ... }
)
```

Combinators have many useful properties:

- repetitive code is abstracted away,
- results are collected with order preserved,
- errors are passed through automatically,
- and control flow is separated from the actual things you do.

The errors point allows us to not write `if (err) return ...` everywhere and the last one
enables us to easily switch flow:

```js
function getKeys(callback) {
    // parallel now
    async.parallel([
        redis.get.bind(redis, 'some-key'),
        redis.get.bind(redis, 'other-key')
    ], callback)
}
```

### Thinking

In traditional imperative programming we decompose our program into serial steps. Callbacks force us to think in continuations. And combinators naturally make us construct our program by combining async calls.

The next step is shifting to combining functions. Essentially go [point free style][pfs] by getting rid of callbacks:

```js
var pf = require('point-free');

var getKeys = pf.parallel(
    redis.get.bind(redis, 'some-key'),
    redis.get.bind(redis, 'other-key')
)
```

Here I use my [point-free][] library, specifically designed to facilitate such thinking. ...

```
serial
... -> getA -> getB -> setSum -> ...

combinators
         serial
        /      \
   parallel    setSum
  /       \
getA     getB
```
**TODO: make a proper image, also how callbacks look?**

Obviously there are more ways to combine async calls than just serially or parallel. To appreciate that let's first look at how values are passed.


### Passing values

When passing function result as callback argument we suddenly get distinction between merely serial action and serial interdependent ones. See how we need to use special waterfall combinator to pass values:

```js
var updateSum = pf.waterfall(
    pf.serial(
        // Using literal functions to illustrate that
        // we don't want anything passed from one to another
        function (callback) {redis.get('some-key', callback)},
        function (callback) {redis.get('other-key', callback)},
    ),
    // Yet we want result from the serial call here
    function (values, callback) {
        redis.set('sum', values[0] + values[1], callback)
    }
)
```

Normally we use closure or other shared namespace for serial statements, so we have no need to care if one statement uses the results of another. This is also possible here, but way to awkward:

```js
var values;
async.series([
    function (callback) {
        getKeys(function (err, _values) {
            if (err) return callback(err);
            // Save result to shared namespace
            values = _values;
            callback();
        })
    },
    function (callback) {
        redis.set('sum', values[0] + values[1], callback)
    }
], done)
```

Using waterfall everywhere is also inconvenient, this will limit our ability to use partial application. Looks like thinking on the level of particular

But notice how we think of particular values

A need is the mother of all inventions

```haskell
updateSum = setSum . serial [get redis "some-key", get redis "other-key"]
```

[async.js]: https://www.npmjs.com/package/async
[point-free]: https://github.com/Suor/point-free
[pfs]: https://en.wikipedia.org/wiki/Tacit_programming



## Thunks

...


## Promises

...




Why async/await is better than generators?

callbacks
continuation passing style
other approaches
combinators and decorators
approaches comparison
ecosystem and limiting need of it
combinator for threads and actors?
explicit green threads/fibers (gevent, ruby:Fiber, node-fibers)

tornado has callbacks, futures, coroutines, @gen.coroutine to wrap generators
@asyncio.coroutine to wrap generator

C# has async on generators? delegates/callbacks?

combinators, decorators, primitives?


core-async = CSP

if using generators or async/await no need in serial or waterfall,
and .map() and friends are replaced with built-ins


if using `yield` you don't need `.spread()`
+ no need for `.catch()`


