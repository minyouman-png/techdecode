---
title: "I Let an AI Coding Agent Build Five Browser Games — Here's the Whole Pipeline"
description: "Five real, playable games — a voxel survival game, a kart racer, a match-3 puzzle, a grand-strategy map game, and a platformer — built with an AI coding agent and shipped to a static site with no server, no build step, and no budget. The deployment pattern, the testing trick that made it possible, and the bugs that almost got through."
date: 2026-07-19T09:00:00
lang: en
key: shipping-five-ai-built-games-2026
author: menew
category: ai
---

Over the course of about a week in July 2026, I shipped five browser games to my own site: a Minecraft-style voxel survival game, a Mario-Kart-style 3D racer, a Candy-Crush-style match-3 puzzle, a grand-strategy game played on a real-world map with over a thousand procedurally generated provinces, and a Super-Mario-style platformer built around Korean folklore. All five run entirely in the browser, with zero backend, zero build step, and zero budget beyond the domain name. All five were built almost entirely by pairing with an AI coding agent, with me acting as product owner, tester, and the one person who actually looks at the screen.

I run this site on AI and tech topics, but I wanted to see how far an AI agent could go on a completely different category of software than the CRUD apps and content pipelines I usually write about: real-time games, with physics, procedural content, and enemy AI, where "it compiles" is nowhere near "it's fun." Here's what shipping five of them taught me about the actual pipeline — and about the one decision that made the whole thing possible.

## Five games, one static folder structure

Each game lives at `public/games/<slug>/` on the site as a handful of static files — an `index.html` and one or two `.js` files, occasionally a small vendored library like Three.js for 3D. There's no bundler, no build step, no npm dependency tree to keep patched. A single registry file lists each game's slug, title, and description in five languages; the games index page, each game's detail page, and the sitemap are all generated from that one list. Adding a sixth game means adding one entry to an array.

The five, briefly:

- **A voxel survival game** — day/night cycle, seven monster types with distinct behaviors, a boss fight every third night, an achievement system, and a first-person combat view with weapon swinging.
- **A 3D kart racer** — a circuit with hills, banking and S-curves, eleven playable characters with different stats, drift-charged turbo, and rubber-banded CPU opponents so races stay close without feeling scripted.
- **A match-3 puzzle** — an 8x8 board, four special-tile types (including a "clear one color" rainbow tile), particle effects, and a synthesized 132bpm background score generated entirely with the Web Audio API — no audio files at all.
- **A grand-strategy game** — a real-world map broken into roughly 1,200 provinces via Voronoi tessellation seeded from actual country borders, population and food-production simulation, and 230 AI-controlled nations with their own diplomacy and war logic.
- **A platformer** — a run-and-jump game with Korean-folklore enemies (gumiho, dokkaebi, a grim-reaper stand-in) standing in for goombas and koopas, five hand-designed stages, and a mountable unicorn that plays the Yoshi role.

None of these needed a server. Progress and local leaderboards live in `localStorage`, with an export/import button so a save file is just a JSON download — the only real workaround for not having a backend, plus a hook left in place (an unused `REMOTE_API` constant) in case I ever want to wire up real cross-device rankings later.

## The deployment loop

The site itself is a static Astro build, pushed to GitHub Pages by force-pushing a freshly built `dist/` folder to a `gh-pages` branch — a two-line script, run whenever there's something new to publish. Language switching across the games (and the rest of the site) uses a plain `?lang=` query parameter rather than separate localized routes, which keeps a single game build serving five languages without any i18n framework. Mobile support came later, as a layer on top rather than a rewrite: touch devices are detected automatically (`pointer: coarse`, with a `?touch=1` override for testing on desktop), and a virtual D-pad and buttons feed the exact same key-state object the keyboard controls already used — so the game logic itself never needed to know whether the input came from a thumb or a keyboard.

## The decision that mattered most: testing without a human

Here's the part that actually made this shippable at the pace it happened. Games are interactive and visual by nature, which makes them unusually hard for an AI agent to verify on its own — you can't easily assert "the physics feel right" from a text diff. The first instinct was to reach for a headless browser and drive the game like a human would. That doesn't work, for a reason that isn't obvious until you hit it: headless Chrome's virtual-time budget does not reliably drive `requestAnimationFrame`. A game loop built on rAF just doesn't run at a useful rate under headless automation, no matter how long you set the virtual time budget to. Any test built on "load the page, wait, take a screenshot" is testing almost nothing.

The fix that made every one of these five games verifiable without a human touching a mouse: every game ships a `?test=sim` mode that steps the game's physics synchronously with a fixed timestep, completely decoupled from `requestAnimationFrame` and the wall clock, and logs assertions with `console.warn` rather than `console.log` — headless Chrome's stderr capture reliably surfaces warnings but drops plain logs. That one pattern — deterministic, synchronous stepping plus warn-level logging — is what let an AI agent check that all five stages of the platformer were completable, that the match-3 board never deadlocks, that province adjacency in the strategy game stays symmetric after tens of AI-driven turns, and that every save file round-trips correctly, all without anyone opening the game in an actual browser tab. A second lightweight mode, `?shot=1`, freezes the frame clock for a single instant so a screenshot can capture a specific dramatic moment (an explosion mid-flight, a boss encounter) for use as the game's cover image — again without relying on timing luck.

## The bug that taught me the most

The grand-strategy game draws its ~1,200 provinces by rasterizing each one's numeric ID into a hidden canvas as a color, then reading pixel colors back to answer questions like "which province is at this coordinate" and "which provinces are adjacent." It's a neat trick — using a canvas as a lookup table instead of a picture — until you remember that canvases apply anti-aliasing at shape boundaries. That blending quietly invented IDs that didn't correspond to any real province at every province edge, which corrupted centroid calculations and adjacency data in ways that were individually tiny but collectively bizarre: Germany's calculated center ended up somewhere in the Atlantic. The fix was to validate every decoded pixel against that province's actual vector bounding box, and fall back to a majority vote among neighboring pixels when a pixel failed that check. The general lesson traveled to other games, too: any time you reuse a rendering surface as a data structure instead of a picture, the rendering pipeline's own conveniences — anti-aliasing, blending, mipmapping — become correctness bugs waiting to happen.

## What an AI agent is actually good for here

After five of these, my honest read is that an AI coding agent is genuinely strong at exactly the things that make solo game development slow: wiring up save systems, generating vector art procedurally on a canvas instead of sourcing sprite assets, tuning difficulty curves once you can measure them (a match-3 balance pass, for instance, is just running thousands of simulated games and comparing average score-per-move against a target), and porting a working pattern from one game to the next. It is not a substitute for actually playing the result — a few bugs only ever showed up because a synthetic test's assertions were technically satisfied while the actual behavior was wrong, and the only real defense was looking at contact-sheet screenshots or playing the build by hand before calling it done. The highest-leverage work in the whole project wasn't any single game — it was building the `?test=sim` pattern once, well, so that every game after the first one inherited a way to be checked without anyone's eyes.

All five games are live and free to play at [menewsoft.com/games](https://menewsoft.com/games/).
