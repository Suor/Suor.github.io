---
layout: post
title: "Growing Over Backward Incompatibility"
comments: false
sharing: false
published: false
categories: [CS]
---

<!-- When language grows it inevitably ... -->
<!-- You can't foresee every use ... -->

Every language needs to grow. It needs to evolve. However, there is a certain barrier it builds around itself over time called "Backward compatibility". Backward compatibility means you can't just change the thing in a best way possible, you need to comply to older design decisions, coincidences and even bugs.

<!-- This could become so annoying that people start ... -->
<!-- It's like going though a contracting tunnel ... -->
<!-- If we thinks of field of all the possibilities ... walls ... -->

So what should conscious designer do?


## Possible strategies

Most languages don't have any explicit strategy for backward incompatible changes, which is pitiful. Mainly because not having a strategy means you are using the worst one.


#### 0. Grow as it goes, then break big.

This results into separation like Python 2/3, Perl 5/6 or even in total abandonment. The major issue is that it creates a gap that most people don't have enough incentive to jump over. It creates additional headache to library developers making hard to support their creations across incompatibility boundary. This in its turn causes chicken and egg problem of no libraries, no users. In its worst separation could divide both ecosystem and community in half, lessening the project considerably.


#### 1. Move fast, break things.

Works well in earlier development stages. I never complained when upgrading Node.js from 0.1.x to 0.2.x broke my app as well as several dependencies. However, this effectively reduces library availability, since many authors just can't or interested enough to keep up with the development pace. I was astonished to hear from some of my ruby friends that they avoid using libraries not updated within 3 months as possibly abandoned ones.

It also poses a strain on language users forced to change their coding habits and to constantly seek for and adapt a replacement libraries for abandoned ones. Some of them consequently settle with particular language or framework version causing an erosion of a community and ecosystem.


#### 2. Stay small.

... and useless. A viable strategy for very domain specific or otherwise having narrow field languages, e.g. for education. In any other case wider audience will need language to be extended to be useful for them. The alternative is to stay small ...

... and provide language extending capabilities. Seems like a good one. However, it hadn't quite worked for lots of lisps and forths. The common issue is that by not providing enough common ground you encourage separating into dialects.

Language of each project gets tailored to project needs, to particular team style. Communities divide, codebases become incompatible effectively narrowing the language for its users and causing confusion for newcomers.

There other issue with both flavors of this strategy is that problem is not solved, it only reduced. There is still no strategy to evolve the core.

<!--
Small standard library with good packaging utilities and service will do the job.
tools do job, language is more subjective.
Unlike libraries frameworks divide people.
 -->


#### 3. Rolling deprecation.

This is when you introduce new things leaving old intact, but marking them as deprecated. After several releases deprecated things are removed and new things take their place. Using this strategy you can continuously introduce changes, still your users have a compatibility guarantee for several releases. There are, however, some considerations to this strategy.

First, you'll need new API each time you update something in backwards incompatible manner. Say you have a function to parse URLs and it returns a dict of query parameters. It however doesn't handle repetitive params well, it just captures last value. So you decided to update it to return a list instead. This change could break someone's code, so you end up with one of:

```python
def parse(url, capture_all=False):
    ...

def parse_all(url):
    ...
```

Your users, respecting deprecation, litter their code with ugly `parse(url, True)` or `parse_all(url)` calls. And when finally you get rid of an old `parse` you need another round of deprecation to return to sane API. On function level this leads to `do_something_ex()` things, on module level we can see `urllib2`, `newforms` and `better-assert`.

Second, you'll obviously need to ship several implementations for things you change. This hardens managing whatever you are doing a bit, but easing life for broader group, whatever users, by making it harder for narrower one, whatever developers, is generally a good trade-off.

Third, gradual change is not always possible. Say you want to change how a `/` operator works in your language. To be compatible it should work the old way in old code and a new way in new one.

<!-- not friendly with semver -->


## Rolling a language

Making an operator work differently depending on context seems impossible, but also offers a hint to resolve both itself and API uglifying issue. So obviously first we need a way to tell new code from old.


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
