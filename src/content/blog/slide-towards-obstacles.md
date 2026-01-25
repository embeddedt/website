---
title: "How modding a voxel game taught me to slide head-first towards obstacles"
description: "Sometimes, it's not good to choose boring"
tags: ['philosophical', 'mcraven-speech', 'minecraft-modding', 'technical']
pubDate: '2026-01-25'
---

> If you want to change the world, sometimes you have to slide down the obstacle head first.

This intriguing statement is the concluding remark in one section of Admiral William McRaven's 2014 University of Texas [commencement speech](https://www.youtube.com/watch?v=yaQZFhrW0fU),
which I have written more about in a [previous post](/blog/its-ok-to-be-a-sugar-cookie).

The context of his remark was, of course, the rigorous and challenging training that McRaven and other Navy SEALs were put through at the start of their career. This part of the training was an obstacle course with a thin rope stretching from a tall tower down to a short one. The intended way to cross was by pulling oneself hand over hand from one side to the other.

McRaven describes how one particularly brave and creative student set out to beat the record time. The student devised the highly risky strategy of sliding on top of the rope instead of incrementally pulling himself along underneath it. While McRaven doesn't provide many more details in the speech, it's not too hard to envision the many ways in which this can go wrong. To start with, the student was almost certainly much wider than the rope, and extremely good balance would be essential to avoid rolling off one side. According to McRaven, one of the towers was 30 feet tall - a massive drop.

Next, excess friction between the student's body and the rope could tear their clothing and scrape them badly, as well as reduce their ability to steer while sliding. Lack of friction, on the other hand, might make a controlled & safe stop at the other tower impossible.

With all these problems in mind, it's not hard to see how the record for this obstacle course stood untouched for so long. Yet the student was seemingly determined to do better. Despite the immense risks involved, he chose to slide head-first down the rope anyway, and McRaven notes that "by the end of the course he had broken the record."

In life, most problems have multiple solutions. Oftentimes, there are a few conventional, low-risk, perhaps even "boring" ways to tackle the problem. These are the approaches that most people giving advice will suggest, and it's because they typically always work.

I by no means intend to suggest that being different just for the sake of it is good. On the contrary, I myself tend to prefer "boring" solutions to problems when possible. They're predictable, and there's lots of information to be found about how they work and don't work. If you're a developer like I am, a great article that talks about this is Dan McKinley's [*Choose Boring Technology*](https://mcfunley.com/choose-boring-technology).

There are still times when thinking outside the box is worthwhile or even necessary, though.  Perhaps you're trying to get a new product idea off the ground, time to market matters, and "boring" takes too long to set up. Or, maybe you know the "boring" solution is the right one but you don't have the budget for it. Or maybe you have already been trying the boring solution, you have hit its limits, and you've determined that no existing solution adequately addresses those limitations. In all of these situations, innovation is certainly worth a try.

I accidentally learned this lesson in late 2022/early 2023, when I was developing the first versions of ModernFix, a performance mod I wrote to address several problems that plagued large-scale modded *Minecraft* instances. One of the performance issues at the time[^cache-modern] was with listing & reading resources embedded inside mod files. Minecraft mods are distributed as `.jar` files, which are essentially ZIPs with a special manifest as the first entry. After some research & experimentation, I found that caching seemed like a good solution to tackle this issue.

Yet the reaction in online spaces by some prominent & experienced community members to this idea was.... less than stellar...

![Discussing porting an optimization from 1.16 to 1.19](@/assets/blog/slide-towards-obstacles/optimization_1.png)
![further reactions](@/assets/blog/slide-towards-obstacles/optimization_2.png)

To be clear - I harbor no ill will towards anyone in these screenshots! We all get along well nowadays and are all part of the current NeoForge team (as of the time of writing).

ModernFix was my first real foray into making a "serious" mod for a modern version of Minecraft - all my previous mods were either built for older versions declining in popularity, or very simple mods that were respins of abandoned concepts. It's also important to note that this segment of the Minecraft community also had a very negative outlook on newcomers writing performance-oriented mods after some prior bad experiences. With this context in mind, it would be entirely reasonable to drop the idea of caching and not pursue it any further. Despite that, I had a suspicion that they were wrong, and the only way to prove or disprove that suspicion would be to press on and try the idea out.

So I did. I committed the [initial version of resource pack caching](https://github.com/embeddedt/ModernFix/commit/bb184a07723f4d454d08fdbc19724b6d242021a2) along with some
other significant patches ([1](https://github.com/embeddedt/ModernFix/commit/055721f4948086553ad76378d185d5b840c84036), [2](https://github.com/embeddedt/ModernFix/commit/26915c6af443bed3c671709bb563a4fa74c0b51f)) and released a test file relatively quietly in spaces I was more familiar with. It quickly became evident that I was right, and I had stumbled on some critical optimizations.

!["you did something incredible"](@/assets/blog/slide-towards-obstacles/optimization_3.png)

I continued to maintain an open mind towards optimization ideas people had previously dismissed. One of ModernFix's most powerful optimizations to this day is the "dynamic resources" system, which dynamically loads & unloads block/item models as they are needed, rather than preloading them all at game startup and keeping them all in system memory forever. In large modpacks this has frequently made the game open 30+ seconds faster on weaker machines and saved at least 1GB of RAM[^number-caveat].

Today, ModernFix sits at just over 163 million downloads, and has become an integral component of almost every large modpack for Minecraft.
But the main takeaway from this post is not intended to be "how to make a successful Minecraft mod". There is always some risk, luck, and/or
providence involved whenever straying off the beaten path. I happened to be working on the right ideas at a time when not many other people
were looking into them. Now that I am "old" in terms of years spent modding and the underlying technology in Minecraft is changing rapidly,
I try to be more humble, knowing that it is likely not long till this story repeats itself with some new mod developer.

With experience comes the wisdom to decide when playing it safe is the right call, versus when the risk is low enough to be worth experimenting. In the case of Minecraft, experimenting was relatively low risk, as players can just remove a mod if it causes problems for them (provided they can easily identify which one to remove). In many other real-world scenarios (including corporate software development) the risk is much higher, and it would be prudent to conduct careful research and properly assess the risk before trying something novel.

Regardless, the core lesson remains clear. If you want to make a difference in some part of your life, or other people's lives,
you have to be willing to get over your fears and find a path through the barriers that you find yourself presented with at the
time. It may not always be easy, but the good things in life don't often come the easy way.

[^cache-modern]: Recently I've seen evidence suggesting this performance problem is sometimes still present in much more recent *Minecraft* versions, though I believe several design changes in both Minecraft and modloaders have made it significantly less severe than it was in the past.
[^number-caveat]: Numbers are back-of-napkin and based on my own (flawed) memory; conduct your own testing to verify before citing them as scientific figures.