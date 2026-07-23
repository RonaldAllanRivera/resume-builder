---
title: 'Four safety layers that do not trust each other'
slug: four-safety-layers-child-ai-companion
metaDescription: 'Defense-in-depth for a child-facing AI companion: age-adaptive prompts, input moderation, a crisis classifier, and output moderation — plus why the hard part is false positives, not detection.'
status: draft
---

Putting an LLM in front of a nine-year-old changes what "good enough" means.

For most products, a bad response is a bad experience. Here, a bad response is a child being told something harmful by a thing their parent installed and told them was safe. The blast radius isn't a churned subscription — it's a family's trust in the person who built it.

So [Wonderkin](https://wonderkin.app) — a parent-controlled AI companion for kids — is built around one assumption: **any single safety layer will eventually fail.** Not might. Will. Models change under you, moderation endpoints have outages, a prompt that held for months stops holding after a provider update.

The architecture that follows from that is four independent layers, none of which trusts the others to have run.

## The pipeline

Every child message goes through the same path, in the same order, server-side:

```
metering → policy → input moderation → crisis classifier
        → model → output moderation → cost recording
```

1. **Policy.** The system prompt is scoped to the child's age band and chat mode, with explicit refusals baked in and an honest "I'm an AI, not a real person" disclosure.
2. **Input moderation.** The child's message is screened *before the model sees it*.
3. **Crisis classification.** A dedicated classifier looks for genuine self-harm, abuse, or danger — and escalates to the parent.
4. **Output moderation.** The model's reply is screened again before it ships.

The redundancy is the design, not an accident of incremental development. Layer 2 does not assume layer 1's prompt held. Layer 4 does not assume layer 2 caught it on the way in. Each one is written as though it's the only thing standing between the model and the child, because on the day one of them regresses, it is.

## Why input *and* output moderation

This looks redundant, and reviewers ask about it. It isn't.

Input moderation catches a child asking for something harmful. Output moderation catches the model *saying* something harmful — which can happen from an entirely innocent prompt. Those are different failure modes with different causes, and screening only one side leaves the other completely open.

Screening the input also means the model never sees the worst content at all, which matters because a model that has been shown something harmful is measurably more likely to engage with it downstream in the same conversation.

## The hard part is false positives

Detection is the part everyone expects to be hard. It mostly isn't — moderation endpoints are good, and a decent classifier catches the obvious cases.

The genuinely hard problem is that **children talk like children.**

A nine-year-old says "I want to die" because their sibling broke a toy. They write violent, dramatic stories because they're eight and that's what eight-year-olds write. They tell jokes with no punchline that read as alarming out of context. They roleplay as a dragon that eats people.

A classifier tuned purely for recall flags all of it. And a system that cries wolf has failed twice over: the parent is buried in alerts and starts ignoring them, so the one alert that genuinely matters arrives in a pile of forty that didn't — and the child learns that talking openly summons a grown-up, so they stop talking openly. You've made the product worse at the exact thing it exists to do.

So the classifier's job is narrower than "detect anything concerning": it flags genuine crisis while deliberately filtering out ordinary sadness, make-believe, and jokes. That distinction — between a child processing a normal bad day and a child in actual danger — is the whole difficulty. It's also why it's a dedicated LLM classifier rather than a keyword filter: "I want to die" and "I want to die, my brother broke my Lego" need different responses, and no wordlist gets there.

Two supporting decisions matter as much as the classification:

**Alerts explain themselves.** A parent gets plain language about *why* something fired, linked to the flagged message in context — not a severity score. A parent who can't evaluate an alert can't act on it.

**Repeats coalesce.** Forty related flags become one card with a count, not forty notifications. Alert fatigue is a safety failure, and it's usually caused by the alerting system rather than the user.

## The boundary is enforced by the compiler

All of this is worthless if a client can skip it.

Every file in the service layer starts with:

```ts
import "server-only";
```

That turns an accidental client import into a **build error** rather than a production key leak. Not a lint warning someone can merge past — the build fails.

This matters more than it first appears. The classic version of this bug isn't someone deliberately calling the model from the browser; it's a shared utility that gets imported into a Client Component eighteen months later by someone who has never read this post. A convention prevents that for as long as everyone remembers the convention. A build error prevents it permanently.

Same reasoning behind the child-mode PIN lock: it's fail-closed, enforced in layouts, route handlers, *and* every server action — with a structural test that fails CI if any surface is left ungated. The test doesn't check that the current surfaces are gated. It checks that no *new* ungated surface can be added, which is the only version that survives contact with future development.

## What I'd tell someone building in this space

**Assume every layer fails, and design for what's left.** The question isn't "is this layer good?" It's "when this layer is silently broken for a week, what still protects the user?" If the answer is nothing, you have one layer with extra steps.

**Tune for the false-positive problem, not the detection problem.** Detection is largely solved. Distinguishing a bad day from a real crisis is not, and it's where the product actually lives or dies.

**Make the boundary structural.** Comments, conventions, and code review all decay. Build errors and CI tests don't. If a rule genuinely must not be broken, express it in something that fails loudly.

**The alert is part of the safety system.** An alert that can't be acted on hasn't protected anyone. Explaining *why* it fired, and not burying it in noise, is not polish — it's the last mile of the feature.

None of this makes the system perfect. It makes the system *survivable* — able to lose a layer without losing the child. In a domain where you cannot promise perfection, that's the honest thing to build, and it's the thing worth being able to explain to a parent.

---

*Building something where an AI talks to a vulnerable user and the safety story has to hold up? [That's the kind of problem I take on](/services).*
