---
title: "From GPT-3 to Fable: What Four Years of Coding With AI Taught Me About Its Future"
description: "A working developer's first-person account of the AI coding revolution — from GPT-3's clumsy autocomplete, through the 'vibe coding' era of Codex, to today's agentic tools like Claude Code and Fable. What actually changed, and where it's going."
date: 2026-07-10
lang: en
key: ai-developer-journey-2026
author: "Tech Decode"
category: ai
---

Most writing about the future of AI comes from analysts and executives. This one comes from the other side of the keyboard. I am a developer, and I have shipped real code with these tools through every stage of the last four years — from the first clumsy GPT models, through the "vibe coding" moment, to the agentic tools I use today like Claude Code and Fable. What I remember most is a single line that kept moving: the boundary between what I did and what the machine did, climbing one step at a time until it had taken tasks I was sure would always be mine. This is what that felt like from the inside — and why I think finding my place as that line keeps moving is now the real job.

> **Note:** This is a personal opinion piece based on my own experience as a developer, not a forecast or investment advice.

## Act I: The autocomplete years (GPT-3 to GPT-4)

The first time I used GPT-3 for code, it felt like a magic trick that fell apart if you looked too closely. It could produce a plausible function, and sometimes it was even right. But it hallucinated APIs that didn't exist, forgot the context two messages back, and confidently invented library methods with a straight face. It was a party trick with flashes of genius.

The workflow, if you could call it that, was **copy-paste roulette.** You asked ChatGPT a question in one window, pasted the answer into your editor, watched it break, and pasted the error back. GPT-4 made this dramatically better — the code was more often correct, the reasoning tighter — but the fundamental shape was the same: the AI was a very smart intern sitting in a *different room*, who could only talk, never touch. It advised; I did all the actual work of wiring it into a real codebase.

Looking back, that era's real lesson was psychological. It taught a generation of developers to *trust an AI a little* — and to *verify everything*, because the cost of a confident hallucination was yours to pay.

## Act II: Vibe coding (Codex and the in-editor era)

The shift that mattered was not a smarter model. It was **moving the AI into the editor.** When code completion tools built on Codex started writing whole blocks inline — in context, where I was actually working — the friction of copy-paste roulette disappeared. Suddenly the AI could *touch* the code.

This is when "vibe coding" entered the vocabulary: describing what you want in plain language and letting the model produce it, riding the vibe rather than typing every character. For small scripts and boilerplate, it was genuinely liberating. I could scaffold an idea in minutes that used to take an afternoon.

But vibe coding also revealed the trap that still defines this whole field. When you stop reading every line, you stop *understanding* every line. Code you didn't write is code you can't fully debug. The productivity was real, but so was a new kind of technical debt: software that works until it doesn't, built by someone — something — you can't cross-examine. The developers who thrived learned a discipline: vibe for speed, but never ship what you haven't understood.

## Act III: The line that kept moving (Claude Code, Fable, and today)

What strikes me most, looking back, is how the boundary of what I did myself kept quietly moving — one step at a time, so gradually that I rarely noticed the moment it crossed.

First, the AI just *wrote the code*, and I did everything else. Then, at some point, it started to *compile* it for me. Then it began to *run* it itself. For a long while, one thing stayed firmly mine: **verification and testing.** The machine could produce and execute, but *I* was the one who confirmed it actually worked, who wrote and ran the tests, who decided it was safe. That felt like a stable border — the human part.

And then that moved too. With agentic tools like Claude Code, driven by a model like Fable, I watched it do the very thing I had assumed was mine to keep: it *verifies*, it *tests*, and now it even *deploys.* I'd hand over a task and it would carry it all the way through — write, compile, run, test, ship — steps I used to guard as the irreducibly human ones.

Each time, I had assumed the line would stop *here.* Each time, it kept climbing.

## What I actually believe about the future

So where does that leave a developer? Watching the machine take over each rung I once thought was mine — compile, run, test, deploy — it would be easy to conclude there's nothing left. But that is not what I've come to believe.

I think there is, consistently, *something* worth a human stepping in for. It's not always the same something — early on it was writing the code, then it was testing it, then verifying it was safe to ship. The specific task keeps changing. What doesn't change is that *some* judgment, some decision, some point where a person needs to look and say "yes, this, not that" keeps reappearing one level up. The line moves, but it never quite vanishes.

And here is the thought I keep returning to: **finding that work — figuring out, in this exact moment of the technology, where a human still genuinely belongs — may itself be the job now.** Not clinging to the old tasks the machine has already absorbed, but continually locating the new place where my judgment still matters. To be a developer in this era is, increasingly, to be someone who keeps re-discovering their own role as the ground shifts. That search isn't a distraction from the work. In an age of AI, I think that search *is* the work.

## The bottom line

The arc from GPT-3 to Fable is usually told as a story about models getting smarter. Living through it, it felt like watching a line move — the boundary between what the machine does and what I do, climbing steadily upward, from writing to compiling to running to testing to deploying. Every time I thought it would stop, it didn't. But I've stopped mourning each rung it takes, because a new place for human judgment keeps opening up one step higher. The task of the AI-era developer may no longer be any single thing on that ladder. It may be the ongoing act of finding where, right now, a person is still needed at all — and being honest enough to keep looking as the answer changes.

---

### FAQ

**Is AI going to replace developers?**
In my experience, it keeps taking over specific *tasks* — writing, compiling, running, testing, and now even deploying — one at a time. But each time, a new place for human judgment opens up one level higher. I don't think the developer disappears; I think the job becomes continually finding where a person is still genuinely needed as that line moves.

**What is "vibe coding"?**
Describing what you want in natural language and letting an AI generate the code, rather than writing every line yourself. It's fast and freeing for simple work, but risky when you stop understanding the code you ship.

**How is agentic AI (like Claude Code) different from ChatGPT?**
ChatGPT-style tools generate text you copy elsewhere. Agentic tools act: they run commands, edit files across a project, run tests, and fix errors in a loop. The shift is from advising to doing.
