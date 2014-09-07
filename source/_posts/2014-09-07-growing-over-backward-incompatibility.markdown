---
layout: post
title: "Growing Over Backward Incompatibility"
comments: true
sharing: true
date: 2014-09-07 19:58
categories: [CS]
hn_id: 8280876
reddit_url: http://www.reddit.com/r/programming/comments/2fpofk/growing_over_backward_incompatibility/
---

Every language needs to grow. It needs to evolve. However, there is a certain barrier it builds around itself over time called "Backward compatibility". Backward compatibility means you can't just change the thing in a best way possible, you need to comply to older design decisions, coincidences and even bugs.

So what should conscious designer do?

<!--more-->


## Possible strategies

Most languages don't have any explicit strategy for backward incompatible changes, which is pitiful. Mainly because not having a strategy means you are using the worst one. But let's review possible strategies.


#### Grow as it goes, then break big

This results into separation like Python 2/3, Perl 5/6 or even in total abandonment. The major issue is that it creates a gap that most people don't have enough incentive to jump over. It creates additional headache to library developers making hard to support their creations across incompatibility boundary. This in its turn causes chicken and egg problem of no libraries, no users. In its worst separation could divide both ecosystem and community in half, lessening the project considerably.


#### Move fast, break things

Works well in earlier development stages. I never complained when upgrading Node.js from 0.1.x to 0.2.x broke my app as well as several dependencies. However, this effectively reduces library availability, since many authors just can't or interested enough to keep up with the development pace. I was astonished to hear from some of my ruby friends that they avoid using libraries not updated within 3 months as possibly abandoned ones.

It also poses a strain on language users forced to change their coding habits and to constantly seek for and adapt a replacement libraries for abandoned ones. Some of them consequently settle with particular language or framework version causing an erosion of a community and ecosystem.


#### Stay small

... and useless. A viable strategy for very domain specific or otherwise having narrow field languages, e.g. for education. In any other case wider audience will need language to be extended to be useful for them. The alternative is to stay small ...

... and provide language extending capabilities. Seems like a good one. However, it hadn't quite worked for lots of lisps and forths. The common issue is that by not providing enough common ground you encourage separating into dialects.

Language of each project gets tailored to project needs, to particular team style. Communities divide, codebases become incompatible effectively narrowing the language for its users and causing confusion for newcomers.

The other issue with both flavors of this approach is that problem is not solved, it's only reduced. There is still no strategy to evolve the core.

<!--
Small standard library with good packaging utilities and service will do the job.
tools do job, language is more subjective.
Unlike libraries frameworks divide people.
 -->


#### Rolling deprecation

This is when you introduce new things leaving old intact, but marking them as deprecated. After several releases deprecated things are removed and new things take their place. Using this strategy you can continuously introduce changes while still providing a compatibility guarantee for several releases. There are, however, some considerations to this strategy.

First, you'll need new API each time you update something in backwards incompatible manner. Say you have a function to parse URLs and it returns a dict of query parameters. It however doesn't handle repetitive params well, it just captures last value. So you decided to update it to return a list instead. This change could break someone's code, so you end up with one of:

```python
def parse(url, capture_all=False):
    ...

def parse_all(url):
    ...
```

Your users, respecting deprecation, litter their code with ugly `parse(url, True)` or `parse_all(url)` calls. And when finally you get rid of an old `parse` you need another round of deprecation to return to sane API. On function level this leads to `do_something_ex()` things, on module level we can see `urllib2`, `newforms` and `better-assert`.

Second, you'll obviously need to ship several implementations for things you change. This hardens managing whatever you are doing a bit. But making life easier for broader group, whatever users, by making it harder for narrower one, whatever developers, is generally a good trade-off.

Third, gradual change is not always possible. Say you want to change how the `/` operator works in your language. To be compatible it should work the old way in old code and a new way in new one.

<!-- not friendly with semver -->


## Rolling a language

Making an operator work differently depending on context seems impossible, but also offers a hint to resolve both itself and API uglifying issue. So obviously first we need a way to tell new code from old. The simplest thing is just stating this explicitly, and this is already used in Python 2:

```python
from __future__ import division
```

and in Perl 5:

```perl
use feature 'say';
```

Python version has file scope and Perls lexical one. Perl also goes farther by bundling features into language versions. E.g. by:

```perl
use v5.16;
```

you can turn on all 5.16 features, this can also deprecate some old features or alter their behavior. Any old code without that `use` statement or with the one with earlier version continues to behave the exact way it did. So we can change a language in a backward incompatible manner while still providing compatibility with older code. <!-- What a trick! -->

So this is it, the idea I started this post to promote. Lower I'll just address any issues/objections that I can think of.


## Issues

Let's start from the ones from rolling deprecation section. First and last are resolved automatically, second - the need to ship several implementations bundled - remains. We can manage that by carefully storing all active implementations and providing a limit on supported versions, e.g. make `use v5.10` an error in 5.20 version of a language. We'll need to make this span large and stable enough though.

There is also an issue of how do we start this process. It's however rather trivial, say our language is at version 3.4 now, when to add our rolling model in 3.5, we add some form of `use` statement there and in absence of it just assume 3.4 semantics.


### Easy parts

These ones are almost automatically solved by version declaration, still some elaboration will probably close unneeded questions.

**Syntax changes**. We have a chicken and egg problem like `use` is part of syntax and it can alter syntax itself. This is however only a problem if we follow Perl 5 lead and allow it anywhere. Although it's cool, it has no relation to solving real problem of "using this library written for Blab 2.7 in my Blab 3.4 code". So we can just require every file start with `use` statement and then parse the rest with appropriate parser. Yes, we'll need to ship several parser implementations, they could share code though.

**Semantic changes**. Like we have the same syntactic construction or operator and it should behave in a new way. The beauty of declared version and separate parsers is that we can substitute a thing during parsing. For example, if we get tired of Python semantics of:

```python
try:
    ...
except E1, E2: # really means "except E1 as E2:",
    ...        # not catch both as you might expect
```

We can just make it to parse into the same thing as `except (E1, E2)`. Altering an AST node resulting from parsing an operator is even easier.

**Built-in changes**. Having all new and old built-ins implementations we'll need only arrange that globals are updated on `use` statement. Globals should be scoped lexically, at least at file level, for this to work. Note that by altering globals we handle all of addition, removal, rename and change of behavior of any built-in.

**Standard library changes**. The easiest way is just shipping several versions of it and patching import statement to load appropriate library version. Different versions of standard libs can share code for efficiency, but that's optional.


### Passing over boundary

Real issues start to arise when we pass something from newer code to older one or vice a versa. Say we have an instance of built-in or standard library type which has changed and pass it to the code that expects to treat it as an instance of an older version of same type.

The simplest thing to do is to provide converters and require a new code interfacing with an older one to use them. This will work, however, it will place significant burden on every forward-looking user of that old code. This is also not future compatible in a sense that if suddenly that old code is updated everyone needs to remove converter calls. And even if we manage somehow to automatically intercept all calls over boundary and convert everything there still be an issues like it could be slow or it would be impossible to share data by reference between newer and older code.

Given all these obstacles, being able to gradually update your code even with a use of converters is significant improvement over major break with just no way to call older code without first updating it. And converters are quite simple thing to implement. But let's take a view into some more elaborate ways to overcome type changes.

Say if a new version of a type has same internal representation and only a new interface then we can pass it as is and rely on some lexical dependent method substitution. This could sound like some unscientific magic, but there is [a corresponding feature][refinements] in ruby 2.0 and sure there is [a perl module][method-lexical] for that. We can even incorporate active language version into method call semantics, this way changed types should just respond to all their historical interfaces in a support window, which probably won't be more than two.

What if internal representation of a type changes? The thing is that shouldn't matter if nobody looks inside. We should still support all the interfaces and we'll be good. This puts a restriction on a kind of access language users, including library authors, have to instances of built-in types. E.g. if instance data is represented with C struct then we shouldn't allow direct access to its members, casting, etc. Everything should be done via functions or at least macros, which could be updated to handle newer representation.


### Wrap-up

There are obviously some things I haven't addressed. And this approach doesn't make language developers lives easier. It could however make it more fun both for developers and their users. Cause this way things don't need to stay broken or weird cause that's how they are. An ability to change language in a backward incompatible manner should in the end bring better languages for everyone. It also feels like freedom.


[refinements]: http://www.ruby-doc.org/core-2.1.1/doc/syntax/refinements_rdoc.html
[method-lexical]: http://search.cpan.org/~chocolate/Method-Lexical/lib/Method/Lexical.pm
