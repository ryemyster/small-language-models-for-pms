# Chapter 02 — Labels and Training Data

Remember those 340 tickets from Monday morning? Before the model can sort them, you have to teach it what sorting means.

You do that with labeled examples — real feedback, paired with the right answer. This chapter walks through what that looks like, what makes a good example, and what quietly breaks a model before it even trains.

---

## The five questions, turned into five labels

In Chapter 01, you had five questions you needed answered before standup:

| Your question | The label |
|---------------|-----------|
| What's broken right now? | `bug_report` |
| What are customers asking us to build? | `feature_request` |
| Is pricing causing frustration? | `pricing_concern` |
| Where are new users getting stuck? | `onboarding_friction` |
| What's already working? | `praise` |

Each label is the model's answer to one of your questions. When a ticket comes in and the model returns `onboarding_friction`, that's it answering: "this one belongs in the 'where are new users getting stuck?' pile."

The model doesn't understand your questions. It doesn't understand anything in the way a person does. What it learns is the pattern: which kinds of text have been labeled which way, across hundreds of examples. Your job is to make those examples clear and consistent enough that the pattern is learnable.

---

## What the model actually receives

For each ticket in your inbox, the model gets one input — the raw text — and returns one output — a label.

Here's a ticket that came in over the weekend:

```
"The dashboard doesn't load on Safari — just a blank white screen."
```

The model reads that and returns:

```
bug_report
```

That's the full interaction. One piece of text in, one label out. The model doesn't know who sent it, when, or what plan they're on. It only sees the words.

---

## Training data is the model's study guide

To teach the model those patterns, you give it a set of labeled examples and say: "Study these. This is how I want you to sort feedback."

The model reads your examples hundreds of times during training. It isn't memorizing them — it's learning the underlying patterns. Words like "broken," "crashes," and "error" tend to appear in `bug_report`. Words like "would love," "please add," and "wish you had" tend to appear in `feature_request`. It picks these up from the data, not from any rules you write.

That means two things:

1. **Quality sets the ceiling.** If your examples are inconsistent — the same kind of ticket labeled differently on different days — the model learns a confused version of your categories. What comes out will be as inconsistent as what went in.

2. **The model can only learn what's in the data.** If all your `onboarding_friction` examples are about getting stuck during account setup, the model won't recognize complaints about confusing documentation as onboarding friction — even if you'd label them that way yourself. It hasn't seen that pattern.

---

## What a strong example looks like

A strong example has one obvious label. If you showed it to a colleague who'd never seen your labeling guide, they'd pick the same category without hesitating.

Here are three tickets from this weekend's inbox, each with a clear label:

```
"The app crashes every time I try to export a report to PDF."
→ bug_report
```

Something broke. There's no ambiguity about what the customer is reporting.

```
"I created my account but couldn't figure out how to invite my team. Gave up after 10 minutes."
→ onboarding_friction
```

A new user ran into a wall. The friction happened during setup.

```
"Your pricing is too high for a small startup — we can't justify it."
→ pricing_concern
```

A customer is frustrated with cost. One label, no question.

---

## What a weak example looks like

### Ambiguous — could honestly be two labels

```
"I was billed for a full month even though I cancelled on day two."
```

Is this `pricing_concern` — frustration with a billing policy — or `bug_report` — a system error that charged them incorrectly? Without knowing more, you can't be sure. If you label it one way and a colleague labels the same type of ticket the other way, the model receives contradictory signals: same pattern, different labels.

**What to do:** Pick the label that fits your team's intent, write it down ("billing errors where the charge seems wrong go under `pricing_concern`"), and apply it consistently. Consistency matters more than being philosophically perfect.

---

### Sits on a category boundary

```
"I don't understand what I'm getting on the Pro plan that I don't already have on Basic."
```

This is frustration about plans and pricing — but it's really about not being able to find clear information. Depending on how you've defined `pricing_concern`, it might fit cleanly or it might sit awkwardly at the edge.

**What to do:** Write a one-sentence definition for each label before you label a single row. Use it every time you're unsure. The definition is the source of truth — not your gut in the moment.

---

### Near-duplicate

```
"The search bar returns no results even when I type an exact match."
"Search is broken — I can't find anything."
```

Both are `bug_report`. Both say the same thing with different words. One extra example that says the same thing adds almost nothing — the model already learned that pattern from the first one. Worse, duplicates that end up in both training and test data make your accuracy numbers look better than they are.

**What to do:** If you're adding examples manually, vary the phrasing. If you're pulling from real inbox data, deduplicate before labeling. The goal is variety, not volume.

---

### Mislabeled

```
"Please add dark mode — it would make long sessions much easier on my eyes."
→ labeled: bug_report   ← wrong, this is feature_request
```

Dark mode doesn't exist yet. Nothing is broken. But if someone was tired, moving fast, or uncertain about the boundary between "the app is missing something" and "the app is broken," they might label this `bug_report` by mistake.

A mislabeled example actively hurts the model. It learns that `bug_report` sometimes includes requests for things that don't exist yet. You'll see the confusion show up in predictions later and won't be able to easily trace it back to the data.

**What to do:** Spot-check your training data before you train. Read 20 random rows. If you find a mislabeled example, fix it — and ask whether the same mistake appears elsewhere with a similar ticket type.

---

## Why more examples isn't automatically better

It's tempting to pad the training set because a bigger number feels more confident. It isn't.

A set of 50 clear, consistent, varied examples will produce a better model than 500 examples where 200 are near-duplicates, 100 are ambiguous, and 50 are mislabeled.

More examples help when:
- A category the model keeps getting wrong needs more signal — add varied examples of that specific type
- You're adding genuine variety: different writing styles, edge cases, phrasings you haven't seen before

More examples hurt when:
- You're padding near-duplicates to hit a round number
- You're adding examples before your label definitions are settled

---

## Labels must be stable before you start

Here's a mistake that costs a lot of time: deciding mid-way through labeling that a category should mean something slightly different.

Say you've labeled 80 tickets and decide that `pricing_concern` should now include billing system errors (not just complaints about price level). To make the data consistent, you'd need to go back through every `pricing_concern` example and re-evaluate it under the new definition. If you don't, the model trains on a split signal — some examples reflect the old definition, some the new one — and learns a confused version of the category that no one intended.

**The rule:** Lock your label definitions before you label anything. Write them down. If a definition needs to change, stop, re-label, then continue.

---

## The training data for this project

The training data lives in `training/data/feedback.csv`. It has 170 labeled examples drawn from the kind of feedback that lands in a product team's inbox on a given week.

| Label | Examples |
|-------|----------|
| `bug_report` | 37 |
| `feature_request` | 34 |
| `pricing_concern` | 29 |
| `praise` | 27 |
| `onboarding_friction` | 25 |

The distribution isn't even — `bug_report` has 37, `onboarding_friction` has 25. That's intentional. In real inbox data, some categories appear more often than others. Artificially balancing to equal counts would make the training data less realistic.

What matters is that every category has at least 20–30 examples. Below that, the model doesn't have enough signal to learn the pattern reliably.

---

## How to add a row

The CSV has two columns: `text` and `label`.

```csv
text,label
"Your text here.",label_name
```

Rules:
- Wrap text in double quotes
- The label must be exactly one of the five values — spelling and underscores matter
- One row = one piece of feedback

**Example from the inbox:**

```csv
"We went from 3 hours of manual reporting per week to 15 minutes. This tool did that.",praise
```

---

## Adapting this for your own inbox

If you want to use this project for a different classification problem, change `training/data/feedback.csv`. Replace the five labels with your own categories, keep the same two-column format, and aim for at least 30 examples per category.

```csv
text,label
"Your first example here.",your_label_name
"Your second example here.",your_label_name
```

---

## Study examples vs. test examples — a preview

Right now, all 170 examples train the model. But in Chapter 05, you'll build a fixed eval suite — a separate set of tickets the model never trains on, used only for testing.

Why does this matter? If you test the model on tickets it studied, you're measuring memorization, not learning. A model can score 100% on its own training data and fail on anything new.

The payoff you're building toward: by Chapter 07, you'll run one command on Monday morning and every ticket in your inbox comes back labeled — `bug_report`, `feature_request`, `pricing_concern`, `onboarding_friction`, or `praise` — consistently, in under a second each, without sending a single ticket to an external API. The fixed eval suite is what tells you whether the model is actually ready for that, or just appears to be.

For now: keep training data and eval data in separate files. Never mix them.

---

**Next:** [Chapter 03 — Train a first rough model](03-train-baseline.md)
