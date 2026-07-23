---
title: 'Your AI app can lose money on a single user. Here is the governor I built.'
slug: llm-cost-governor-downgrade-instead-of-blocking
metaDescription: 'Per-account LLM cost ceilings that downgrade the model at 80% instead of hard-stopping — token-accurate pricing, timezone-correct enforcement, and the float bug that made the threshold silently unreachable.'
status: draft
---

Flat-rate pricing on top of a metered API is a bet that your average user costs less than your subscription price. Usually true. The problem is that "usually" isn't a business model — a single enthusiastic user on an unbounded plan can cost more than they pay, and you find out at the end of the month.

I hit this building [Wonderkin](https://wonderkin.app), a parent-controlled AI companion for kids. Children are *exactly* the user who breaks the average. A kid who discovers the thing will talk to it for an hour straight. That's a feature — it's the product working — so "make it less fun" was never an acceptable fix.

## Hard caps are the obvious answer and they're bad

The first instinct is a hard ceiling: track spend, block at the limit.

It works, and it produces the worst possible user experience. A child is mid-conversation and the app stops. From their side there's no explanation — it just breaks. From the parent's side, the thing they paid for died on the 24th.

The cap is doing its job. It's still a terrible outcome, because a hard limit treats the last 20% of the month as worthless when it's actually the part where you most need the product to keep working.

## Downgrade instead of stop

The rule I landed on: **at 80% of the monthly ceiling, quietly switch to the cheapest model.**

```ts
/**
 * Cost governor: once an account has spent this fraction of its plan's
 * monthly ceiling, chat falls back to the default (cheapest) model instead
 * of blocking later. Kids keep chatting through the last stretch at ~5× less
 * cost; the hard ceiling in consume_quota remains the final stop.
 */
export const GOVERNOR_THRESHOLD = 0.8;
```

The economics work out. Once the governor engages, the remaining spend accrues about five times slower — so the last 20% of budget stretches across roughly the rest of the month. In practice the account lands under the ceiling without anyone hitting a wall.

The child notices nothing. Answers get marginally less sophisticated. For "help me with fractions" that gap is not detectable, and a slightly simpler answer is strictly better than an error message.

Three constraints in the implementation are worth stealing:

```ts
export function governedModel(
  planModel: string | null | undefined,
  spentUsd: number,
  ceilingUsd: number | null | undefined,
): { model: string; governed: boolean } {
  const resolved = resolveChatModel(planModel);
  const ceiling = Number(ceilingUsd ?? 0);
  if (!(ceiling > 0)) return { model: resolved, governed: false };

  const spent = Math.round(spentUsd * 1e6);
  const threshold = Math.round(ceiling * GOVERNOR_THRESHOLD * 1e6);

  if (spent < threshold) return { model: resolved, governed: false };
  if (resolved === DEFAULT_CHAT_MODEL) return { model: resolved, governed: false };
  return { model: DEFAULT_CHAT_MODEL, governed: true };
}
```

**It only ever downgrades.** There is no path where this function returns a more expensive model than the plan's. A cost control that can *increase* cost under some branch isn't a cost control.

**No ceiling means no governing.** If the ceiling is null or zero, it returns untouched. An unconfigured value must never be read as "zero budget, downgrade everyone" — the failure mode of a misconfigured cost control should be *inert*, not *degrade every customer at once*.

**Already-cheapest is not "governed".** If the plan already uses the default model, it returns `governed: false` rather than claiming a downgrade that didn't happen. That flag drives what the parent sees; reporting a downgrade that never occurred is a lie in the dashboard.

## The float bug that made the threshold unreachable

Here's the part I'd have shipped wrong if I hadn't tested the exact boundary.

The obvious comparison is `spentUsd >= ceilingUsd * 0.8`. In JavaScript, with a $6 ceiling:

```js
> 0.8 * 6
4.800000000000001

> 4.8 >= 0.8 * 6
false
```

An account that has spent exactly $4.80 of a $6.00 ceiling is at exactly 80%, and the naive comparison says it isn't. The governor silently doesn't fire.

This is ordinary IEEE-754 behaviour, and it's easy to wave off as a rounding edge case that'll resolve itself on the next message. Two reasons it isn't:

The costs being compared are computed by the same pricing code to six decimal places, so exact-boundary values are *common*, not exotic. And a cost control that fails to engage doesn't announce itself — it produces a slightly larger bill and no error. Nobody investigates a system that appears to be working.

The fix is to compare in integer micro-dollars:

```ts
const spent = Math.round(spentUsd * 1e6);
const threshold = Math.round(ceiling * GOVERNOR_THRESHOLD * 1e6);
```

Same principle as storing money in cents. The generalisation: **any comparison that gates money should happen in integers**, at the precision the money is stored in. Floats are fine for display and wrong for decisions.

## The line I won't cross

The safety classifier is never governed:

```ts
// The safety classifier model is untouched by design:
// detection quality never depends on spend.
```

Wonderkin runs a crisis classifier that flags self-harm, abuse, or danger in a child's message and escalates to the parent. It runs on its own model, and the governor does not touch it. Ever.

The alternative is indefensible the moment you say it out loud: *a child gets worse safety monitoring in the last week of the month, because their family used the product a lot.* Cost engineering ends where child safety begins, and that boundary has to be structural — one function that decides the chat model, with the safety model provably out of scope — rather than something a future refactor might quietly optimise away.

That's the general principle, and it's the one I'd carry to any product with an AI cost problem: **cost controls may degrade quality, never safety.** If you can't cleanly separate the two in code, you can't apply cost controls at all.

## Two details that took longer than the governor

**Price what you actually spend, not what the pricing page says.** Costs are computed per model actually used, with input, output, and prompt-cache read *and* write tokens priced separately. Prompt caching makes reads dramatically cheaper than writes, and if you meter all input tokens at the same rate your numbers drift from your invoice — usually in the direction that makes you feel safe until the bill lands.

**Enforce in the user's timezone, not the server's.** Usage is computed inside a Postgres RPC using the parent's timezone. If the dashboard says "$4.10 used today" in Manila time and the gate resets on UTC midnight, the parent is looking at a number that doesn't match the rule being enforced on them. It's a support ticket generator, and every one of them starts with the customer being right.

## The shape of it

If you're putting a metered model behind a flat-rate plan:

1. **Degrade before you deny.** A cheaper answer beats an error every time.
2. **Compare money as integers.** Test the exact boundary — that's where floats bite, and the failure is silent.
3. **Fail inert on missing config.** Unconfigured must never mean "govern everyone."
4. **Never let cost controls reach safety systems.** Make it structural, not a convention.
5. **Meter in the user's timezone.** The dashboard and the gate must be the same number.

None of this is exotic. It's about two days of work. It's the difference between a plan whose worst case you know and one whose worst case you find out about.

---

*Building something with an LLM behind a subscription and unsure where the ceiling should go? [That's the kind of problem I take on](/services).*
