# Chapter 02 — Labels and Training Data

## Before you start

**Your working folder for this chapter:** `chapters/02-labels-and-data/`

Open your terminal and navigate there:

```bash
cd chapters/02-labels-and-data
```

**✓ Confirm you're in the right place:**

```bash
ls
```

You should see:

```
README.md   data/
```

And inside `data/`:

```bash
ls data/
```

```
feedback-starter.csv
```

That's your working file for this chapter. It has one example per label to show you the format. Your job is to study how it's built — and understand why the examples are written the way they are.

> [!NOTE]
> **What about `training/data/feedback.csv`?** That's the completed version — 163 labeled examples — in the root project. You'll see it referenced throughout this doc as an example of what a finished training file looks like. Don't edit it. Your working file is `chapters/02-labels-and-data/data/feedback-starter.csv`.

---

**What you'll do in this chapter:**
- Understand what labels are and how the model uses them
- Learn what makes a strong vs. weak training example
- See the full training dataset and understand how it's structured

**What you'll have when you're done:**
- A clear mental model of what training data is and why it matters
- Ready to move into Chapter 03 (training)

---

Remember those 340 tickets from Monday morning? Before the model can sort them, you have to teach it what sorting means.

You teach it with labeled examples — real feedback, each paired with the right answer. This chapter walks through what that looks like and what quietly breaks a model before training even starts.

---

## First: open your working file

**Open `chapters/02-labels-and-data/data/feedback-starter.csv` in your text editor now.**

You should see two columns: `text` and `label`. The first few rows look like this:

```
text,label
"The dashboard doesn't load on Safari — just a blank white screen.",bug_report
"I'd love a way to schedule reports to send automatically each week.",feature_request
"Your per-seat pricing doesn't work for our team.",pricing_concern
```

This is the file the model will study. Every row is one piece of feedback, paired with the right category. Your job in this chapter is to understand why these examples are written the way they are — and what makes a bad example quietly ruin a model.

---

## The five questions, turned into five labels

In Chapter 01, you had five questions you needed answered before standup. Each one becomes a label — a category the model learns to predict.

| Your question | The label |
|---------------|-----------|
| What's broken right now? | `bug_report` |
| What are customers asking us to build? | `feature_request` |
| Is pricing causing frustration? | `pricing_concern` |
| Where are new users getting stuck? | `onboarding_friction` |
| What's already working? | `praise` |

When a ticket comes in and the model returns `onboarding_friction`, that's the model answering: "this belongs in the 'where are new users getting stuck?' pile."

The model doesn't understand your questions the way you do. What it learns is the pattern — which kinds of text have been labeled which way, across hundreds of examples. Your job is to make those examples clear and consistent enough that the pattern is learnable.

> [!NOTE]
> **Your job:** These five labels are not a technical detail — they are the five metrics you're tracking. If you define `onboarding_friction` too broadly and it catches both "new user got stuck" and "billing was confusing on day one," your Monday-morning answer to "where are new users getting stuck?" will be inflated and misleading. Getting the labels right is a product decision, not a data task.

> [!TIP]
> **Tradeoff:** You could split `pricing_concern` into `pricing_level` (too expensive) and `billing_error` (charged incorrectly). That gives you more granular answers — and also means labeling more carefully, needing more training examples per category, and maintaining a more complex model. The right rule: start with the broadest labels that answer your real questions. Split a category only when the model shows you it's confused between two things you actually care about differently.

> [!IMPORTANT]
> **Customer impact:** Label design determines which customer problems get seen and which get lost. If `onboarding_friction` and `bug_report` are defined too loosely, a new user who hits a broken step during signup gets counted as a bug report — not an onboarding problem. Engineering gets the ticket. The onboarding team never hears about it. The signup flow doesn't improve. The customer wrote detailed feedback, it got processed, and nothing changed — not because anyone ignored it, but because the label sent it to the wrong place.

---

## What the model actually receives

For each ticket in your inbox, the model gets one input — the raw text — and returns one output — a label.

Here's an example from the weekend inbox:

```
Input:  "The dashboard doesn't load on Safari — just a blank white screen."
Output: bug_report
```

That's the full interaction. One piece of text in, one label out. The model doesn't know who sent it, when, or what plan they're on. It only sees the words.

---

## Training data: the model's study guide

To teach the model those patterns, you give it a set of labeled examples and say: "Study these. This is how I want you to sort feedback."

The model reads your examples hundreds of times during training. It isn't memorizing them — it's learning the underlying patterns. Words like "broken," "crashes," and "error" tend to appear in `bug_report`. Words like "would love" and "please add" tend to appear in `feature_request`. It picks these up from the data, not from any rules you write.

That means two things:

1. **Quality sets the ceiling.** If your examples are inconsistent — the same kind of ticket labeled differently on different days — the model learns a confused version of your categories.
2. **The model can only learn what's in the data.** If all your `onboarding_friction` examples are about getting stuck during account setup, the model won't recognize complaints about confusing documentation as onboarding friction — even if you'd label them that way yourself.

---

## What a strong example looks like

A strong example has one obvious label. If you showed it to a colleague who'd never seen your labeling guide, they'd pick the same category without hesitating.

**Look at these three examples in `feedback.csv`:**

```
"The app crashes every time I try to export a report to PDF."
→ bug_report
```
Something broke. No ambiguity about what the customer is reporting.

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

Weak examples cause problems quietly. You won't notice until the model starts making weird predictions. Here are four patterns to watch for.

### 1. Ambiguous — could honestly be two labels

**Example:**
```
"I was billed for a full month even though I cancelled on day two."
```

Is this `pricing_concern` (frustration with a billing policy) or `bug_report` (a system error that charged incorrectly)? Without knowing more, you can't be sure.

If you label it one way and a colleague labels the same type of ticket the other way, the model receives contradictory signals — same pattern, different labels.

**Fix:** Pick the label that fits your team's intent, write it down ("billing errors where the charge seems wrong go under `pricing_concern`"), and apply it consistently. Consistency matters more than being philosophically perfect.

---

### 2. Sits on a category boundary

**Example:**
```
"I don't understand what I'm getting on the Pro plan that I don't already have on Basic."
```

This is frustration about plans and pricing — but it's really about not being able to find clear information. Depending on how you've defined `pricing_concern`, it might fit cleanly or it might sit awkwardly at the edge.

**Fix:** Write a one-sentence definition for each label before you label a single row. Use it every time you're unsure. The definition is the source of truth — not your gut in the moment.

---

### 3. Near-duplicate

**Example:**
```
"The search bar returns no results even when I type an exact match."
"Search is broken — I can't find anything."
```

Both are `bug_report`. Both say the same thing with different words. One extra example that says the same thing adds almost nothing — the model already learned that pattern from the first one.

**Fix:** If you're adding examples manually, vary the phrasing, the tone, and the channel style (a Slack message looks different from a Zendesk ticket). The goal is variety, not volume.

---

### 4. Mislabeled

**Example:**
```
"Please add dark mode — it would make long sessions much easier on my eyes."
→ labeled: bug_report   ← wrong, this is feature_request
```

Dark mode doesn't exist yet. Nothing is broken. But if someone was moving fast, they might label this `bug_report` by mistake.

A mislabeled example actively hurts the model. It learns that `bug_report` sometimes includes requests for things that don't exist yet. You'll see the confusion show up in predictions later and won't be able to easily trace it back here.

**Fix:** Before you train, read 20 random rows from `feedback.csv` out loud. If you find a mislabeled example, fix it. Ask whether the same mistake appears elsewhere with a similar ticket type.

---

## More examples isn't automatically better

It's tempting to pad the training set because a bigger number feels more confident. It isn't.

A set of 50 clear, consistent, varied examples produces a better model than 500 examples where 200 are near-duplicates, 100 are ambiguous, and 50 are mislabeled.

**More examples help when:**
- A category the model keeps getting wrong needs more signal — add varied examples of that specific type
- You're adding genuine variety: different writing styles, edge cases, phrasings you haven't seen before

**More examples hurt when:**
- You're padding near-duplicates to hit a round number
- You're adding examples before your label definitions are settled

> [!NOTE]
> **PM analogy:** Counting labeled rows as a measure of progress is the same mistake as counting features shipped. Input volume is not output quality. The right measure is whether the model's score improves on the weak categories — and you won't know that until Chapter 05. For now, focus on variety and consistency, not row count.

---

## Lock your labels before you start labeling

Here's a mistake that costs a lot of time: deciding mid-way through labeling that a category should mean something slightly different.

Say you've labeled 80 tickets and decide that `pricing_concern` should now include billing system errors — not just complaints about price level. To make the data consistent, you'd need to go back through every `pricing_concern` example and re-evaluate it under the new definition. If you don't, the model trains on a split signal and learns a confused version of the category that no one intended.

**The rule:** Lock your label definitions before you label anything. Write them down. If a definition needs to change, stop, re-label, then continue.

> [!NOTE]
> **Why this is a product problem, not just a data problem:** If your label definitions shift mid-way, the model learns a confused category — but you won't notice until you look at the confusion matrix (Chapter 05) and see erratic predictions. More importantly, you lose the ability to track trends over time. If this week's `pricing_concern` count is based on a broader definition than last week's, the trend line is meaningless. Consistent labels are what make Monday-morning comparisons trustworthy.

> [!IMPORTANT]
> **Customer impact:** Inconsistent labels don't just muddy your data — they create inconsistent follow-through. A pricing complaint that gets labeled `bug_report` one week and `pricing_concern` the next means the pricing team only sees half the signal. Customers raising the same concern repeatedly see no response, because the pattern only exists in the full dataset — which the model is presenting inconsistently. Their repeated feedback appears to vanish. From their perspective, no one is listening.

---

## The full training dataset — what you're working toward

The completed training file is at `training/data/feedback.csv` in the root project. **Open it in your text editor now** — just to browse. You're not editing this one.

Scroll through it. Notice a few things:

- The tone varies — some are formal multi-sentence tickets, some are short Slack-style messages
- The channels vary — Zendesk tickets, NPS verbatims, CS call notes, app store reviews
- The language varies — formal complaints, casual frustration, polite requests

That variety is intentional. Your real inbox looks like this. A model trained on only formal, polished tickets will struggle with a one-line Slack message like "export still broken fyi."

Here's the distribution across labels:

| Label | Examples |
|-------|----------|
| `bug_report` | 40 |
| `feature_request` | 34 |
| `onboarding_friction` | 30 |
| `praise` | 30 |
| `pricing_concern` | 29 |

`bug_report` has the most because bug reports tend to be the highest-volume category in most support inboxes. Every category has at least 29 examples — below 20–30, the model doesn't have enough signal to learn a pattern reliably.

---

## How to add a row to the training data

The CSV has two columns: `text` and `label`.

```csv
text,label
"Your text here.",label_name
```

**Rules:**
- Wrap text in double quotes
- The label must be exactly one of the five values — spelling and underscores matter
- One row = one piece of feedback

**To add a new example:**

1. Open `chapters/02-labels-and-data/data/feedback-starter.csv` in your text editor
2. Scroll to the last row
3. Add a new line in this format:

```csv
"We went from 3 hours of manual reporting per week to 15 minutes. This tool did that.",praise
```

4. Save the file

That's it. The training script reads the file automatically — you don't need to register the new row anywhere else.

---

## Training examples vs. test examples — a preview

Right now, all 163 examples train the model. But in Chapter 05, you'll build a fixed eval suite — a separate set of tickets the model never trains on, used only for testing.

**Why does this matter?** If you test the model on tickets it studied, you're measuring memorization, not learning. A model can score 100% on its own training data and fail on anything new.

Keep this rule in mind as you add examples: **training data and eval data stay in separate files. Never mix them.**

---

## What you just learned

Before you move on, make sure you can answer these:

- What are the five labels this model predicts?
- What makes an example ambiguous?
- Why does more data not automatically mean a better model?
- What's the one rule about label definitions?

If any of those feel fuzzy, re-read the relevant section. These concepts are the foundation for everything in the next seven chapters.

---

**Next:** [Chapter 03 — Train a first rough model](03-train-baseline.md)
