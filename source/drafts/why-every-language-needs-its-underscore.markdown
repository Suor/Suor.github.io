---
layout: post
title: "Why Every Language Needs Its Underscore"
comments: false
sharing: false
published: false
categories: [FP]
---

*(This is an adaptation of a talk I gave at PyCon and DevDay. [Slides](http://www.slideshare.net/hackflow/why-underscore) and [video](http://www.youtube.com/watch?v=lGAC6ftYUS0#t=12100) are available in russian)*

Do you know what [underscore][] is? In its most general it's a JavaScript library that makes life easier. For whoever writes in JavaScript. I mostly write Python and I also wanted my life easier, so I went ahead and wrote [a similar library for Python][funcy]. But the thing is you need to understand a magic behind something to properly replicate it. So what's the magic behind _?

<!--more-->


## The problem

To answer this question we should look at problems this kind of libraries solve. To get some ground I'll illustrate them with code.


### A piece of entangled code

This messy piece of code was taken from real project and slightly simplified:

<div class="example-bad">
``` python
images = []
for url in urls:
    for attempt in range(DOWNLOAD_TRIES):
        try:
            images.append(download_image(url))
            break
        except HttpError:
            if attempt + 1 == DOWNLOAD_TRIES:
                raise
```
</div>

There are several things entangled in here, but my point is that this could be written much shorter:

<div class="example-good">
``` python
http_retry = retry(TRIES, HttpError)
harder_download = http_retry(download_image)
images = map(harder_download, urls)
```
</div>

If it seems hard at first, then it's okay. It involves some functions and [control flow abstractions][acf] most probably new to you. Once you get used to it you'll find that the latter variant is not only shorter, but is also simpler.


### Dirty dictionary

But let's go on and clean some dirty dictionary:

<div class="example-bad">
``` python
d = {}
for k, v in request.items():
    try:
        d[k] = int(v)
    except (TypeError, ValueError):
        d[k] = None
```
</div>

Here we go through dictionary and clean its values by coercing them to `int` or to `None` if that's impossible. Cleaning input and ignoring malformed data is quite frequent task and yet it takes so much effort. This is the way I want to write that:

<div class="example-good">
``` python
walk_values(silent(int), request)
```
</div>

And it's entirely possible with [funcy][]. But let's move to the next one.


### Pairwise iteration

This code checks if a sequence is ascending:

<div class="example-bad">
``` python
prev = None
for x in seq:
    if prev and x >= seq:
        is_ascending = False
        break
    prev = x
else:
    is_ascending = True
```
</div>

Ah, iterating over a sequence and keeping track of a precious element. How many times had you done that? There should be a function to abstract that:

<div class="example-good">
``` python
is_ascending = all(l < r for l, r in pairwise(seq))
```
</div>

And [pairwise][] here does exactly that. It enables us to iterate by sequence adjacent pairs. So we just need to check that all of them are ordered accordingly.

Больше кода

- дольше писать
- дольше читать
- дольше отлаживать
- больше ошибок

.. Что вы любите больше писать новый код или отлаживать старый? Не хотите много отлаживать - пишите меньше кода :)

.. Идеальная программа - кода нет, но задача решается.

Нельзя просто взять и начать писать меньше кода. В конце концов, код пишется ради решения каких-то задач, а не сам по себе. Что нужно делать чтобы задачи по прежнему решались, а кода писалось меньше? Для этого нужно чаще использовать старый код. Для этого он должен быть соответствующим образом подготовлен. Сложно использовать большие запутанные куски. Нужно разбить свой код на простые и маленькие. И главное незапутанные.

Что значит незапутанные? Значит содержащий один аспект, одну сторону.

Вернёмся к самому первому примеру.

... retry пример

Что здесь происходит? На самом деле, 3 вещи:

- загрузка картинок (полезный экшн)
- повторные попытки загрузки
- итерация и сбор результатов

.. retry пример подсвеченный по действиям

Мы видим, что тут не просто присутствует 3 аспекта в небольшом кусочке кода, но они запутаны. Если я захочу использовать тот же механизм повторных попыток ещё где-то, с другим действием, а не загрузкой картинки, то мне, видимо, придётся скопировать весь кусок. Но когда мы говорим о повторном использовании кода, то, как правило, мы не имеем в виду копи-пасту :)

Альтернативой было бы вынести весь код для повторных попыток в отдельную функцию.

.. Функция должна работать с произвольным полезным действием, т.е. должна принимать функцию, т.е. должна быть функцией высшего порядка. Так ФП появляется естественным образом.

``` python
def retry(...):
    ...

harder_download = retry(DOWNLOAD_TRIES, HttpError)(download_image)
images = []
for url in urls:
    images.append(harder_download(url))
```

Всё ещё осталась итерация со сборкой результатов. Ну и полезный экшн (нагрузка), от него избавляться не хотелось бы :) Однако, сделаем следующий шаг и свернём цикл в вызов соответствующей функции:

``` python
def retry(...):
    ...

harder_download = retry(DOWNLOAD_TRIES, HttpError)(download_image)
images = map(harder_download, urls)
```

Функция map вызывает свой первый аргумент для каждого элемента urls и результаты собирает в список, в данном случае images. На самом деле, map - такая часто полезная функция, что в отличие от retry, встроена в питон, также присутствует в underscore, как и в большинстве современных языков, включая все кроме самых старых реализаций JavaScriptа. Там она присутствует в виде метода массива map.

Заметим, что функция retry никак не связана с текущей задачей (как и map), поэтому её можно использовать повторно, да и вообще вынести в библиотечку. То самое повторное использование кода.

Зачем нужен _?
- вынести туда распространённую функциональность

Вспомним второй наш пример.

``` python
d = {}
for k, v in request.items():
    try:
        d[k] = int(v)
    except (TypeError, ValueError):
        d[k] = None

walk_values(silent(int), request)
```

Если посмотреть на обычный код с циклом, то мы видим, что в нём присутствует много вещей, которых нет во втором куске. Это собственно цикл, получение пар ключ-значение из словаря, ловля исключений и ещё кой-какие мелочи.

.. Если сформулировать то, что мы делаем как "привести значения словаря к целым числам", то в этой фразе просто не будет ничего о ключах, также не упоминается цикл/итерация, значит в коде больше, чем в задаче. Сложность решения - сложность задачи. Incidential complexity.

Давайте внимательно сравним эти два куска кода, но для начала для простоты выбросим обработку исключений:


``` python
walk_values(int, request)

{k: int(v) for k, v in request.items()}
```

Я свернул цикл в генератор словаря. Для незнакомых с питоном поюсню вкратце как он работает. Мы просто строим словарь с ключами k и значениями int(v) для всех k и v в списке пар ключ-значение словаря request. Т.е. это тот же самый цикл, но словарь строиться одновременно с итерацией. Теперь в обоих вариантах у нас по одной строчке и, что первая лучше, уже не так очевидно.

Однако посмотрим на них под таким углом. Здесь я подсветил различные аспекты выражения разными цветами. ...

(подсветка компонентов)
``` python
walk_values(int, request)

{k: int(v) for k, v in request.items()}
```

Очевидно, вторая строчка цветастее. И это плохо, потому как пиша или читая такой код, мы все эти аспекты в свой мозг загружаем. Однако, как известно в голову за раз залазит около 7 вещей. Соответственно вторая строчка займёт всё наше внимание, тогда как первая оставит часть, чтобы смотреть на то, что происходит вокруг. Т.е. мы просто будем видеть большую картину.

Иначе на эти две сточки можно посмотреть таким образом:

(подсветка низкого уровня)
``` python
walk_values(int, request)

{k: int(v) for k, v in request.items()}
```

Здесь я выделил красным те детали, которые являются низкоуровневыми в генераторе списков по сравнению с первым выражением. Другими словами, всё, что выделено красным, не является необходимым для понимания того, что делает вырадение в целом. Это его детали реализации.


Зачем нужен _?
- содержит распространённую функциональность
- скрывает низкоуровневые детали


Можно посмотреть на это ещё и под таким углом:

```
привести значения словаря к целым числам

построить словарь из пар "ключ - значение, приведённое к целому числу"
для каждой пары ключ - значение данного словаря
```

Таким образом, о более высокоуровневом коде на языке программирования мы склонны рассуждать в более абстракных терминах естественного языка. И как и языки высокого уровня в программировании, такие рассуждения будут более кратко излагать то же решение той же задачи. А задачи, которые в низкоуровневых рассуждениях были неподъёмными теперь становятся вполне доступными.


Зачем нужен _?
- содержит распространённую функциональность
- скрывает низкоуровневые детали
- подстёгивает мышление на более высоком/абстрактном уровне


Очень существенные вещи. И это ещё не всё. Вернёмся к третьему моему примеру:

``` python
#
prev = None
for x in seq:
    if prev and x >= seq:
        is_ascending = False
        break
    prev = x
else:
    is_ascending = True

#
is_ascending = all(l < r for l, r in pairwise(seq))
```

Я не буду ничего подсвечивать на этот раз, просто прочитаю последнюю строчку

```
последовательность возрастает, если *для всех* её *соседних пар* левый сосед меньше правого.
```

Я выделил *для всех* и *соседних пар* потому что это понятия, которые соответствуют функциям all и pairwise в коде. Таким образом, эти функции порождают понятия в естестенном языке. Это перекликается с тем, что мы уже видели с walk_values, но на этот раз чётче видно как функции порождают новые понятия в нашем естественном языке.


Зачем нужен _?
- содержит распространённую функциональность
- скрывает низкоуровневые детали
- подстёгивает мышление на более высоком/абстрактном уровне
- предоставляет набор высокоуровненвых понятий
  (для размышления о программах и алгоритмах)


Легко видеть, что эти пункты не зависят от языка, и в то же время бесспорно полезны. Именно поэтому каждому языку нужен свой underscore.


Библиотеки

JavaScript - Array, Function, underscore, lowdash
Python - itertools, functools, funcy, toolz, fn.py
Ruby - Enumerable, ActiveSupport
PHP - functional-php, Underscore.php
Clojure - clojure.core


Посмотрите их, но помните, что это каждая такая библиотека это больше, чем просто набор функций.

Спасибо.


[acf]: http://hackflow.com/blog/2013/10/08/abstracting-control-flow/

[underscore]: http://underscorejs.org/
[funcy]: https://github.com/Suor/funcy
[pairwise]: http://funcy.readthedocs.org/en/latest/seqs.html#pairwise

