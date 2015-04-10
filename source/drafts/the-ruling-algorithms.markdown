---
layout: post
title: "The Ruling Algorithms"
comments: false
published: false
sharing: false
categories: [Thoughts]
---

Hey intro ...

<!--more-->

oDesk added new metric -- job success rate. This new feature disrupted status quo of using average
feedback score. Profiles people were building up for years suddenly became useless to the point where it makes sense to delete your account and start afresh. Let look closer what's wrong with it.

First and most important thing -- it affects your living, if you have low score you are effectively invisible to potential clients, so if over the years you started to rely on oDesk as your primary source of income then you are screwed.

Second -- nobody understands how it works, there is no public formula, support answers contradict each other, there are rumours of private feedback that is incorporated into that.

Third -- it's out of your control both because you don't know how this works and you don't have access to some of the factors.

There are bonus points for delaying score recalculation for unknown long periods (days and weeks), this protects from user reverse engineering it. It also creates additional suspense 'cause now it's just some thing that changes randomly at unpredicatable intervals and can totally screw you up at any moment. Best thing done on freelance website ever.

Obviously it will be fixed or people will migrate to another site. We could have just laughed and forgot until it would have started...


## Getting Serious

Imagine some city ER infrastructure like this:

```
MAP
hospital, hospital
ambulances, roads, houses, districts
```

ER operators are having hard times to regulate all these so we introduce some automation, an operators application to show all the calls with all the relevant data, like address, cause, condition:

Time | Name | Condition | Address | Urgency |
---- | ---- | --------- | ------- | ------- |
4 min ago | John | Heart Attack | ... | High *(cause heart attack)*
3 min ago | Martha | Food poisoning | ... | Medium
... | ...    | ... | ... | ...
... | *cut line* | ... | ... | ... *(operator can't see anything under it)*
5 min ago | Sam | ... | ... | ... *(invisible)*
... | ...    | ... | ... | ...

Operator looks at this and assigns ambulances to calls. Obviously you want to be at the top here, but it's sorted according to some complex algorithm taking into account urgency, time of the call and possibly more factors.

The algorithm is set up or trained to minimize harm, so that less people die or get complications. But various considerations immediately start to arrive.


## Software Glitch

What if algorithm works for most but penalizes some? And this some never show over the cut line until list is full enough. Operator won't see you, ambulance won't come. Such software glitch could kill you.

How is this possible? ... many factors, black box, unpredictable algorithm results ...
... reference to Summa Technologiae?


 or a group of people?


## Statistical Bug

Another possibility is penalization of a group of people united by location, age, race, gender or whatever. Algorithms know nothing about equality or ethics, at least by default. So it's quite possible that algorithm that will "reduce harm" the best will not work equally well for everyone. E.g. ...

The thing with this issue is that you can't spot it until you run statistics on system performance over significant period. So if such bug got itself into a system it will lurk there for years undetected. We will need statistical debugging to catch those and even better statistical testing: modelling work of the system with generated or historical input.

I need to say that it's not enough to just test algorithm to be fair, you need to test the whole system. Let's look how UI can get into equation:

Time | Name | Condition | Address | Urgency |
---- | ---- | --------- | ------- | ------- |
... | ...    | ... | ... | ...
4 min ago | John | Food poisoning | ... | Medium
4 min ago | John | Food poisoning | ... | Medium
... | ...    | ... | ... | ...
<!-- TODO: large table -->

<!-- a bit later positions could be updated and Johns drawn apart -->

Here we have 2 very similar rows, so there is a possibility for operator to pass by second John.
Even if probability of that is small, say 5%, in the end it can result into ambulance coming to average John 25 seconds later comparing to Arthur. So it's now bad to have widespread (common?) name.

We should also take into account operator: what if we use colors in UI to indicate things? Colors have different meanings in different cultures, so operator will subconsciously look up things in different order depending on her culture. And what if operator is colorblind?

These were only a handful of possible scenarios, and you can't really foresee their full variety,
it is the reason why this is so complex.

? For some group it could be actually worse with new system than it were with paper and pencil.


## Security Bug?

Any software glitches or statistical bugs described above could be implanted intentionally. What if there is a person skilled and wuzzy enough to hack into the system? What if he also doesn't like jews? Then he could alter the algorithm to lower anybody with jew-like name and serious condition in the table, lower not too much and not all the time. This kind of thing could stick in the system for years.


## Not a Bug

Introduce time of arrival, traffic, a region behind a bridge.

Feature - in order to minimize harm we should penalize anyone behind the bridge or even just gave up on them. Math is merciless.


## No way back

Dismantling system will kill people. Even downgrading will.


<!-- Larger system could try to get rid of older people or ... -->


- works for most, but doesn't work for some or group of people,
- statistical bug, (statistical debugging)
- security issues,
- not a bug, feature (traffic example),
- no way back.
