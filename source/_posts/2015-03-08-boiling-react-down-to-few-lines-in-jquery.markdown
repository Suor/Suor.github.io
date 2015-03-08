---
layout: post
title: "Boiling React Down to Few Lines in jQuery"
comments: true
date: 2015-03-08 20:08
categories: [FP, UI]
---

You probably heard something like how React is awesome 'cause it makes UI a pure function of application state? But even before you started to get that it was complemented with something like how that works on top of immutability and virtual DOM? And then you get free save, load, undo and something insane called time-travel debugging on top of that. Guess what? None of these are necessary to use core React idea and reap its benefits. And I'll show that in a few lines in jQuery.

<!--more-->

```html
<span id="colored-counter">0</span>
<input id="color"></input>
<button id="inc"></button>

<script>
$('#color').on('keyup', function () {
    $('#colored-counter').css('color', this.value);
})

$('#inc').on('click', function () {
    var oldValue = $('#colored-counter').html();
    var newValue = 1 + Number(old);
    $('#colored-counter').html(newValue);
})
</script>
```

Could be written as:

```html
<span id="colored-counter">0</span>
<input id="color"></input>
<button id="inc"></button>

<script>
var state = {color: '', value: 0};

function updateUI() {
    $('#colored-counter').css('color', state.color);
    $('#colored-counter').html(state.value);
}

$('#color').on('keyup', function () {
    state.color = this.value;
    updateUI();
})

$('#inc').on('click', function () {
    state.value++;
    updateUI();
})
</script>
```

This demonstrates React idea in its simplest (and a bit bastardized way). We get to this later, now we should answer a reasonable question: how is this better?
Let me draw you a picture. This is how first variant works:

<img src="/images/boiling-react-down/jquery-small.svg" style="width: 100%" />

And this is how second one does:

<img src="/images/boiling-react-down/react-small.svg" style="width: 100%" />

Doesn't look that much better, but let us think scale. Over time our UI will get more events and elements, some events will update more than one element, some elements will be updated by more than one event. So we will get this:

<img src="/images/boiling-react-down/jquery-big.svg" style="width: 100%" />

And even with our bastardized React-like code we get:

<img src="/images/boiling-react-down/react-big.svg" style="width: 100%" />

In first picture we have `N` events, `M` elements and up to `O(N*M)` links.
In second one we have just `N` event links and `M` element links.
Overall we got from potential `O(N*M)` complexity down to `O(N+M)`, not bad for a simple trick.

Now it looks like we got something. But what about all those magical powers?
Ah, we almost got them too.


## Magical Powers

Basically all magical powers mentioned come from an ability to write:

```js
// save
var cannedState = deepcopy(state);

// load
state = cannedState;
updateUI();
```

This is facilitated by 2 facts:

- we have a single explicit state,
- we can update UI to comply to arbitrary state.

That's it. We can write serialized canned state to local storage, send it to server, manage a history of canned states. And this will give us page reload protection, persistence and undo/time-travel respectively.

Confused? Let's write some code. That's how we protect from accidental page reload:

```js
function updateUI() {
    // Save latest state to local storage
    LocalStorage.set('state', JSON.stringify(state));
    // ... continue as usual
}

// Load saved state from local storage on page load
$(function () {
    state = JSON.parse(LocalStorage.get('state'));
    updateUI();
});
```

And that's how we get time-travel debugging:

```html
<span id="time-pos"></span>
<button id="back">Back</button>
<button id="next">Next</button>

<script>
var time = {history: [], pos: 0};

function updateTimeUI() {
    $('#time-pos').html('Position ' + time.pos + ' of ' + time.history.length);
}

function saveState() {
    time.history.push(deepcopy(state));
    time.pos++;
    updateTimeUI();
}

$('#back').on('click', function () {
    // Move history pointer
    time.pos--;
    updateTimeUI();
    // Load historic state
    state = time.history[time.pos];
    updateUI();
})
$('#next').on('click', function () {
    time.pos++;
    // ... same
})

// ...

function updateUI() {
    // Save state to history on every change
    saveState();
    // ... continue as usual
}
</script>
```

On each change of state we push its deep copy to history list and later we can restore that state by simply copying it from history and updating UI to fit it.

Note also how we use the same pattern here? `time` is the state of time-travel sub-application
and `updateTimeUI()` is its update function.

Now we can build from that. Undo is just time-travel for user not developer, by saving history to local storage we can preserve it on page reload, by catching errors and sending them along with serialized history to our bug tracker we can automatically reproduce errors our users face.

I should note that React doesn't have all these magical powers, at least out of the box, since it separates app state into pieces and hide it in components.


## Pure Function

Why do we need pure functions, immutable data and virtual DOM? These are optimizations and to some extent simplifications, not core to idea. Still let's us follow the way that led to them.

First we need a slightly more intricate example:

```html
<span id="count">2</span>
<ul>
    <li>hi</li>
    <li>there</li>
</ul>
<button id="add"></button>

<script>
var state = {items: ['hi', 'there']}

function updateUI() {
    $('#count').html(state.items.length);
    // Compare ul.childNodes to state.items and make updates
    // ...
}

$('ul li').on('click', function () {
    delete state.items[this.index]; // TODO: check if this works
    updateUI();
})

$('#add').on('click', function () {
    state.items.push(getRandomString());
    updateUI();
})
</script>
```

Several things to see here:

- there is a duplication between prerendered html and initial state,
- update became complex 'cause we need to compare data structure to DOM.

There is a simpler way to do this:

```html
<div id="ui"></div>
...

<script>
...

function render(state) {
    var span = '<span id="count">' + state.items.length + '</span>';
    var lis = state.items.map(function (item) {
        return '<li>' + item + '</li>';
    });
    return span + '<ul>' + lis.join('') + '</ul>'
}

function updateUI() {
    $('#id').html(render(state));
}

...
</script>
```

Here `render()` is just pure function from app state to html. And we want it to be pure so that
state will be the single thing defining UI.

In a way UI was a function of state even in our bastardized code, it just wasn't clearly obvious
'cause we updated UI, not calculated and rebuilt it from scratch each time. There also was a possibility to screw up and write `updateUI()` so that UI state is defined both by its own previous state and application state, thus using render is not really an optimization, but a simplification and a guard.

But anyway that's it on pure functions.


## Virtual DOM

Now look at those `render()` / `$().html()` pair, they build entire representation from scratch on each event, probably on every key press. This sounds slow, so we use another optimization &mdash; virtual DOM:

```js
var root = document.getElementById('ui');
var prevState = state, prevTree = [];

function render(state) {
    // Virtual DOM is really just a tree of JavaScript objects or arrays
    return [
        ['span', {id: 'count'}, state.items.length],
        ['ul', {}, state.items.map(function (item) {
            return  ['li', {}, item]
        })]
    ]
}

function updateUI() {
    var vTree = render(state);
    var diff = vDiff(prevTree, vTree); // Just a diff on data structures, haha :)
    vApply(root, diff)                 // Apply series of patches to real DOM

    prevState = deepcopy(state);
    prevTree = vTree;
}
```

If any of this diffing/patching sounds complicated to you then you shouldn't worry React or [standalone virtual DOM implementation][virtual-dom] got you covered. But that's really not that complicated. If you know how to write diffing algorithm then you can surely implement this yourself.

Note that what we just did is a premature optimization. Current simple example will do just fine
with naive render-to-string implementation above. Surprisingly, most of SPAs out there will do just
fine as well, browsers are hell fast these days. I want to stress this once more - for an average app you can skip React or other virtual DOM at start and only go for it once it gets too slow (or never).

Another stone in Reacts direction: it's virtual DOM is [one of the slowest ones][virtual-dom-benchmark] across the block.


## Immutability

Noticed all that `deepcopy()` calls lying around, this looks like a waste (it really is cheap, but bear with me). The idea of immutable data-structures is instead of copying everything to save older states we build new state based on previous one without changing it.

Maybe it is still not clear enough, so I show you. That's how we make immutable object in JS:

```js
var object = {
    a: {x: 1, y: 2},
    b: {text: 'hi'}
}

// Now instead of object.a.y = 3 we do
var object2 = {
    a: {x: object.a.x, y: 3},
    b: object.b
}
```

Look how we reuse `object.a.x` and `object.b`. This not only saves us from copying, but effectively makes diffs way faster: before diffing `object.b` and `object2.b` we just check if they are the same object, which is referential equality, and done &mdash; diff is empty, no need to go all the way down.

One thing to add is this naive approach to immutable collections is not only cumbersome, but also ineffective. Suppose you have an object with lots of keys and a value of one of them changes,
you now need to create a new object with all the same keys (you can still reuse values). You probably don't use such objects, but what about array? Let's see how that looks like:

```js
var prev = ['a', 'b', 'c', ..., 'z'];
var next = prev.slice(0, n-1).concat([newValue]).concat(prev.slice(n));
```

So we need to copy the whole thing. Here is a better way to implement immutable sequences:

```js
var prev = {
    '0-3': {
        '0-1': {0: 'a', 1: 'b'},
        '2-3': {...},
    },
    '4-7': {...}
}
var next = {
    '0-3': {
        '0-1': prev['0-3']['0-1'],
        '2-3': {
            2: 'hey',
            3: prev['0-3']['2-3'][3]
        }
    },
    '4-7': prev['4-7']
}
```

We can see that we only create `log N` new objects here and the rest is reused, so even less copying and faster diffs. You also don't need to really deal with all this trees. There are great ready to use implementations out there. E.g. this is how our first example looks with a help of
[Immutable.js][]:

```js
var object = Immutable.fromJS({
    a: {x: 1, y: 2},
    b: {text: 'hi'}
})

var object2 = object.setIn(['a', 'y'], 3); // object remains intact
```

It gives you nice API, efficiency and protection against accidentally writing to supposed to be immutable collection. Also take a look at [mori][] &mdash; a set of immutable collections extracted from ClojureScript.

Note that React actually uses naive immutable by convention collections.


## Wrap-up

It may look from my notes that React is not a good tool, but it is actually very useful one.
It may not have magical powers and top speed, but it got components and is still pretty fast. It also offers ecosystem and community.

And there is one more way to look at it. React made a significant push to front-end development in an interesting direction, including all those virtual DOMs and immutable collection libraries.

Anyway, now that you know all this, you can judge better on what to use and how to structure your code.


[virtual-dom]: https://github.com/Matt-Esch/virtual-dom
[virtual-dom-benchmark]: http://vdom-benchmark.github.io/vdom-benchmark/
[Immutable.js]: https://github.com/facebook/immutable-js
[mori]: https://github.com/swannodette/mori
