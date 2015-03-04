---
layout: post
title: "Boiling React Down to Few Lines in jQuery"
comments: false
published: false
categories: [FP, UI]
---

You probably heard something like how React is awesome cause it make UI a pure function of app state. But even before you started to get it it was complemented with something like how that works on top of immutability and virtual DOM? And then you get free Save/Load/Undo and something insane called time-travel debugging on top of that. Guess what? None of these are necessary to use core React idea. And I'll show that in a few lines of jQuery.

<!--more-->

```html
<span id="colored-counter">0</span>
<input id="color"></input>
<button id="inc"></button>

<script>
$('#color').on('keyup', function () {
    $('#colored-counter').css('color', this.value); // TODO: check if this works
})

$('#inc').on('click', function () {
    var oldValue = $('#colored-counter').html();
    var newValue = 1 + Number(old);
    $('#colored-counter').html(newValue);
})
</script>
```

Could be written as

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

This demonstrates React idea in a its simplest (and a bit bastardized way). We get to this later, now we should answer a logical question.
How this is better? Let me draw you a picture. This is how first variant works:

```
event1 -> updateEl
event2 -> updateEl
```

And this is how second one:

```
event1 -> |
          | update state -> update UI
event2 -> |
```

Still no better, but let us think scale. Over time our UI will get more events and elements,
some events will update more than one element, some elements will be updated by one than one event.
So we will get this:

```
event1 --> updateEl1 <-\
       \-> updateEl2 <-+--\
        /-------------/   |
event2 --> updateEl3 <-\  |
event3 ---------------/   |
       \------------------/
...
```

And even with our bastardized React-like code we get:

```
event1 -> |
event2 -> |
event3 -> | update state -> update UI
...       |
eventN -> |
```

In first picture we have `N` events, `M` elements and `O(N*M)` links.
In second one we have just `N` links and update UI procedure with complexity proportional to size of state, which is `O(M)`. Overall we got from `O(N*M)` complexity down to `O(N+M)`, not bad for a simple trick.

Now it looks like we got something. But what about all those magical powers?
Ah! We already got them!


## Magical Powers

Basically all magical powers mentioned come from an ability to write:

```js
// save
var cannedState = deepcopy(state);

// load
state = cannedState;
updateUI();
```

This is facilitated by 2 facts: - we have single explicit state, - we can update UI to comply to arbitrary state.

That's it. We can write serialized canned state to local storage, send it to server, manage a history of canned states. And this will give us browser close protection, persistence and undo/time-travel respectively.

Confused? Let's write some code. That's how we protect from accidental browser closing:

```js
function updateUI() {
    LocalStorage.set('state', JSON.stringify(state));
    // ... continue as usual
}

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
var time = {history: [state], pos: 0};

function updateTimeUI() {
    $('#time-pos').html('Position ' + time.pos + ' of ' + time.history.length);
}

function saveState(state) {
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
    saveState(state);
    // ... continue as usual
}
</script>
```

Note how we use the same pattern here? ...

What about Undo? We already got it: undo is just time-travel for user not developer.


## FP godness / Pure Function

Why do we need pure functions, immutable data and virtual DOM? These are optimizations,
not core to Reacts idea! Still let's us follow the way that led to them.

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
- update became complex cause we need to compare data structures.

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

Here `render()` is just pure function from app state to html. Why we want it to be pure?
Cause we want state define UI.

In a way UI was a function of state even in our bastardized code, it just wasn't clearly obvious
cause we updated UI, not rebuilt it from scratch each time.

But anyway that's it on pure functions.

.. To be honest using render is not really an optimization, but simplification.


## Virtual DOM

Now look at those `render() / $().html()` pair, they build entire representation from scratch on each event, probably on every key press. This sounds slow, so we use another optimization - virtual DOM:

```js
var root = document.getElementById('ui');
var prevState = state, prevTree = [];

function render(state) {
    // Virtual Dom is really just a tree of JavaScript objects or arrays
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

If any of this diffing/patching sounds complicated to you then you shouldn't worry React or [standalone virtual DOM implementation]() got you covered. But that's really not that complicated. If you know how to write diffing algorithm then you can surely implement this yourself.

Note that what we just did is a premature optimization. Current simple example will do just fine
with naive render-to-string implementation above. Surprisingly, most of SPAs out there will do just
fine as well, browsers are hell fast these days. I want to stress this once more - for an average app you can skip React or other virtual DOM at start and only go for it once it gets too slow.

.. Virtual DOM also adds one other convenience it preserves implicit hidden state in DOM elements by not recreating them each time.


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

Sure, this is cumbersome, but only cause JS objects are not meant to do this. We can wrap this to get nice interface and to protect object from accidentally mutating it:

```js
// TODO: use real example from mori or alike
var object = Immutable({
    a: {x: 1, y: 2},
    b: {text: 'hi'}
})

var object2 = object.set('a.y', 3); // object remains intact
```

But anyway look how we reuse `object.a.x` and `object.b`. This not only saves us from copying, but effectively makes diff way faster - before diffing `object.b` and `object2.b` we just check if they are the same object, which is referential equality, and done - diff is empty, no need to go all the way down.

One thing to add is this naive approach to immutable collections is not only cumbersome, but also ineffective. Suppose you have an object with lots of keys and a value of one of them changes,
you now need to create a new object with all the same keys (you can reuse still values). You probably don't use such objects, but what about array? Let's see how that looks like:

```js
var prev = [0, 1, 2, ..., 99];
var next = prev.slice(0, n-1).concat([newValue]).concat(prev.slice(n));
```

So we need to copy the whole thing. Here is a better way to implement immutable sequences:

```js
// NOTE: use 0-7 ?
var prev = {
    '0-49': {
        '0-24': {...},
        '25-49': {...},
    },
    ...
}
var next = {
    '0-49': {
        '0-24': prev['0-49']['0-24'],
        '25-49': {
            '25-37': {
                ...
            }
            '38-48': prev[...][...]
        }
    },
    '50-99': prev['50-99']
}
```

We can see that we only create `log N` new objects here and the rest is reused, so even less copying and faster diffs. You also don't need to really deal with all this trees. There are [great ready to use implementations out there]()

.. Fetch is now also `O(log N)` cause we do it like:

```js
seq['0-49']['25-49']['25-37']['25-31']['28-31']['30-31']['30']
```

P.S. React actually uses naive immutable collections. (TODO: check this)


## Wrap-up

...


# Next post

Components and split state.
Cursors and Lenses.
FRP and atoms.

...

boiling-react-down-to-few-lines-in-jquery
