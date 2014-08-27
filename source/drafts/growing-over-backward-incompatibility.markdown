---
layout: post
title: "Growing Over Backward Incompatibility"
comments: false
published: false
categories: [Thoughts]
---

<!-- When language grows it inevitably ... -->

<!-- You can't foresee every use ... -->

Every language needs to grow. It needs to evolve. However, there is a certain barrier it builds around itself over time called "Backward compatibility". Backward compatibility means you can't just change the thing in a best way possible, you need to comply to older design decisions, coincidences and even bugs.

So what should conscious designer do?


## Possible strategies

Most languages don't have any explicit strategy for backward incompatible changes, which is pitiful. Mainly because not having a strategy means you are using the worst one.


#### 0. Grow as it goes, then break big.

This results into separation like Python 2/3, Perl 5/6 or even in total abandonment. The major issue is that it creates a gap that most people don't have enough incentive to jump over. It creates additional headache to library developers making hard to support their creations across incompatibility boundary. This in its turn causes chicken and egg problem of no libraries, no users. In its worst separation could divide both ecosystem and community in half, lessening the project considerably.


#### 1. Move fast, break things.

Works well in earlier development stages. I never complained when upgrading Node.js from 0.1.x to 0.2.x broke my app as well as several dependencies. However, this effectively reduces library availability, since many authors just can't or interested enough to keep up with the development pace. I was astonished to hear from some of my ruby friends that they avoid using libraries not updated within 3 months as possibly abandoned ones.

It also poses a strain on language users forced to change their coding habits and to constantly seek for and adapt a replacement libraries for abandoned ones. Some of them consequently settle with particular language or framework version causing an erosion of a community and ecosystem.


#### 2. Stay small.

... and useless. A viable strategy for very domain specific or otherwise having narrow field languages, e.g. for education. In any other case wider audience will need language to be extended to be useful for them.

... and provide language extending capabilities. Seems like a good one. However, it hadn't quite worked for lots of lisps and forths. The common issue is that by not providing enough common ground you encourage separating into dialects.

Language of each project gets tailored to project needs, to particular team style.
Communities divide, codebases become incompatible effectively narrowing the language for its users and causing confusion for newcomers.

Small standard library with good packaging utilities and service will do the job.

tools do job, language is more subjective.

Unlike libraries frameworks divide people.



<!-- This could become so annoying that people start ... -->

<!-- It's like going though a contracting tunnel ... -->

<!-- If we thinks of field of all the possibilities ... walls ... -->

Strategies:

- grow as it goes, then dump everything and start with a fresh one
- stay small, provide language extending capabilities (dialects)
- move fast, break things
- rolling model (Perl, Django)
    + single change, which can't be introduced gradually


```python
def f(x=None):
    pass
```


Issues:

- syntactic changes (parser changes)
- built-ins changes
- renames
- deprecations (removals)
- operator semantics
- type changes
    + changed methods
    + changed internal representation
    + swapping type (convert over lexical boundary? manual? auto?)

>

Perl 5 experience, Django model.

Easy in lexical scope, problems with anything spanning scope boundaries.
Type convertors.
