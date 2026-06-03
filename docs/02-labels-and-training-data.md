# Chapter 02 — Labels and Training Data

Before you train a model, you need to teach it what you want. You do that with labeled examples — real text paired with the right answer.

This chapter explains what that means, what makes a good example, and what makes a bad one. By the end, you'll be able to add your own rows to the training data and spot the problems that will quietly hurt your model later.

---

## What a label is

A label is a category. It's the answer you want the model to produce when it sees a piece of text.

In this project, there are five labels:

| Label | What it means |
|-------|---------------|
| `bug_report` | Something in the product is broken |
| `feature_request` | A customer wants something the product doesn't do yet |
| `pricing_concern` | A customer is frustrated with cost, plans, or billing |
| `onboarding_friction` | A new user had trouble getting started |
| `praise` | Positive feedback — something is working well |

These five categories aren't arbitrary. They map directly to the five questions from Chapter 01. Each label answers one of those questions.

---

## What an input is

An input is the text the model reads. In this project, that's a single piece of customer feedback — one support ticket, one NPS comment, one survey response.

The model reads the input and returns a label.

That's it. One piece of text in, one label out.

---

## Training data is the model's study guide

When you fine-tune a model, you give it a set of examples and tell it: "Study these. This is how I want you to think about this problem."

The model reads your examples hundreds of times. It looks for patterns — which words appear with which labels, how phrasing relates to category. It doesn't memorize individual examples; it learns the patterns across all of them.

This means two things:

1. **The quality of your examples sets the ceiling.** A model trained on vague, inconsistent labels will produce vague, inconsistent predictions. Garbage in, garbage out is more literal here than in most contexts.

2. **The model can only learn what's in the data.** If all your `onboarding_friction` examples are about account setup and none are about confusing documentation, the model won't recognize documentation complaints as onboarding friction — even if you'd label them that way yourself.

---

## What a strong example looks like

A strong example is unambiguous. Someone reading it should immediately know which label is right, without having to think hard.

```
"The app crashes every time I try to export a report to PDF."
→ bug_report
```

```
"I created my account but couldn't figure out how to invite my team. Gave up after 10 minutes."
→ onboarding_friction
```

```
"Your pricing is too high for a small startup — we can't justify it."
→ pricing_concern
```

Each of these has one obvious label. The text makes the category clear.

---

## What a weak example looks like

### Ambiguous — could reasonably be two labels

```
"I was billed for a full month even though I cancelled on day two."
```

Is this `pricing_concern` (a complaint about billing policy) or `bug_report` (a billing system error)? It depends on context you don't have. If you label it `pricing_concern` and someone else would label it `bug_report`, the model gets a contradictory signal.

**What to do:** Pick the label that best fits your team's intent, and write a brief note in your labeling guide so the next person makes the same call. Consistency matters more than being technically perfect.

---

### Ambiguous at a boundary

```
"I don't understand what I'm getting on the Pro plan that I don't already have on Basic."
```

This could be `pricing_concern` (confusion about plan value) or something closer to a documentation complaint. The label depends on how you've defined `pricing_concern`. If your definition is "any frustration related to cost or plans," this fits. If it's "complaints about price level specifically," it might not.

**What to do:** Write a one-sentence definition of each label before you start labeling. Refer to it every time you're unsure.

---

### Duplicate or near-duplicate

```
"The search bar returns no results even when I type an exact match."
"Search is broken — I can't find anything."
```

Both are `bug_report`. Having two nearly identical examples isn't useful — the model learns the same pattern twice without learning anything new. Worse, near-duplicates in training data often end up in the test set too (because splitting is done randomly), which makes your accuracy numbers look better than they are.

**What to do:** If you're adding examples manually, vary the phrasing. If you're pulling from real customer data, deduplicate before labeling.

---

### Mislabeled

```
"Please add dark mode — it would make long sessions much easier on my eyes."
→ labeled: bug_report   ← wrong
```

This is a `feature_request`. Dark mode doesn't exist yet — there's nothing broken. A mislabeled example is worse than no example, because the model learns the wrong pattern and you get errors you can't easily trace back to the cause.

**What to do:** Spot-check your data before training. Read 20 random rows. If you find mislabeled examples, fix them — and check whether the same mistake appears elsewhere.

---

## Why more data is not automatically better data

It's tempting to think that adding more examples always helps. It doesn't, if those examples are weak.

A training set with 50 clear, consistent, well-distributed examples will produce a better model than 500 examples where 200 are duplicates, 100 are ambiguous, and 50 are mislabeled.

More data helps when:
- You have a category the model keeps getting wrong (add more examples of that specific type)
- You're adding genuine variety — new phrasings, edge cases, different writing styles

More data hurts when:
- You're padding with near-duplicates to hit an arbitrary row count
- You're adding examples before you've stabilized your label definitions

---

## Labels must be stable before you train

Once you start training, don't change your label definitions mid-way. Here's why.

If you decide halfway through that `pricing_concern` should now include billing bugs (not just pricing complaints), you need to go back and re-label all the examples you already wrote under the old definition. If you don't, the model gets contradictory signals: some `pricing_concern` examples are about price level, some are about billing errors. It will learn a confused version of the category.

**The rule:** Lock your label definitions before you label a single row. Write them down. Refer to them. Change them only before you start, or after you've relabeled everything.

---

## The current training data

The training data for this project lives in `training/data/feedback.csv`. It has 170 labeled examples across the five categories:

| Label | Examples |
|-------|----------|
| `bug_report` | 37 |
| `feature_request` | 34 |
| `pricing_concern` | 29 |
| `praise` | 27 |
| `onboarding_friction` | 25 |

The distribution isn't perfectly even — `bug_report` has 37 examples, `onboarding_friction` has 25. This is normal. In real customer data, some categories are more common than others. Completely even distribution would be artificial.

What matters is that each category has at least 20–30 examples. Below that, the model doesn't have enough signal to learn the pattern reliably.

---

## How to add a row

The CSV has two columns: `text` and `label`.

```csv
text,label
"Your text here.",label_name
```

Rules:
- Wrap text in double quotes
- If the text itself contains a double quote, use two double quotes: `""`
- The label must be exactly one of the five values above — spelling and underscores matter
- One row = one piece of feedback

**Example:**

```csv
"The bulk export feature exports only the first page — not all records.",bug_report
```

---

## Using this for your own data

If you want to adapt this project for a different classification problem, the only file you need to change is `training/data/feedback.csv`.

Replace the five labels with your own categories. Keep the same two-column format. Aim for at least 30 examples per category.

A template to copy:

```csv
text,label
"Your first example here.",your_label_name
"Your second example here.",your_label_name
```

---

## Study examples vs. test examples — a preview

Right now, all 170 examples are used for training. But in Chapter 05, you'll build a fixed eval suite — a separate set of examples the model never trains on.

Why does that matter? Because if you test a model on the same examples it studied, you're not measuring how well it learned — you're measuring how well it memorized. A model can score 100% on its own training data and fail on anything new.

The eval set is the model's real test. You'll build it deliberately, not by splitting the training data randomly. That distinction will matter a lot when you get there.

For now: keep your training data and your eval data in separate files. Don't mix them.

---

**Next:** [Chapter 03 — Train a first rough model](03-train-baseline.md)
