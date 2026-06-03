# Chapter 06 — Tune the Model Deliberately

You have a baseline. You have a fixed eval that tells you the truth. You know exactly where the model fails.

Now you fix it — one deliberate change at a time.

This chapter runs one tuning cycle from start to finish: identify the target, understand why the model is wrong, make one change, retrain, measure. By the end, you'll have a before-and-after comparison you can trust, and the habit of tuning that makes every future improvement legible.

---

## The experiment log

Before you change anything, open `training/experiment-log.md` and fill in Run 0 with your baseline scores from Chapter 05.

```
| Run 0 (baseline) | today | Nothing | 81% | 0.89 | 0.85 | 0.71 | 0.90 | 0.76 |
```

Write it down before you retrain. Once you've retrained, the baseline is gone — you can only compare if you recorded it first.

> [!NOTE]
> **Your job:** The experiment log is the same thing as a product changelog for the model. Without it, "the model got better" is a feeling. With it, it's a fact: `onboarding_friction` F1 went from 0.71 to 0.79 on the fixed eval after adding 10 targeted examples. That's a sentence you can put in a team update, a decision memo, or a case for investing more time in the model.

---

## Step 1 — Find the target

Look at your Chapter 05 eval output. You're looking for two things:

**Lowest F1 by label.** That's your weakest category. From the example output in Chapter 05, it's `onboarding_friction` at F1 = 0.71.

**Most common confusion in the matrix.** The `onboarding_friction` row showed:

```
onboarding_friction    3    1    14    0    2
```

Three `onboarding_friction` tickets predicted as `bug_report`. One predicted as `feature_request`. Two as `pricing_concern`.

The target is clear: `onboarding_friction` mislabeled as `bug_report`, three times. That's a pattern, not noise.

> [!NOTE]
> **Your job:** Choosing what to fix first is a prioritisation decision, not a technical one. You could work on `pricing_concern` (F1 = 0.76) or `onboarding_friction` (F1 = 0.71). The right choice depends on which failure costs more. If your product team is actively working on an onboarding redesign, getting `onboarding_friction` right matters more. If pricing is a board-level concern this quarter, fix that first. The eval gives you the data. You make the call.

> [!IMPORTANT]
> **Customer impact:** `onboarding_friction` mislabeled as `bug_report` means new users who hit a wall during setup get routed to the bug queue — not the growth or onboarding team. Engineers see the ticket. Nobody looks at the signup flow. New users keep hitting the same wall. Every week the model runs with this confusion, that failure compounds.

---

## Step 2 — Understand why the model is wrong

Read the actual mistakes from the Chapter 05 eval output:

```
Text:      I set up everything the documentation said and got a blank dashboard...
Actual:    onboarding_friction
Predicted: bug_report

Text:      The error message on the import screen says 'invalid format'...
Actual:    onboarding_friction
Predicted: bug_report
```

The pattern is specific: onboarding friction examples that describe something *not working* during setup — an error, a blank screen, a stuck step — look like bug reports to the model. The words "error," "blank," "nothing appeared" appear in bug reports too. The model learned those words as bug signals and doesn't yet have enough signal that the *context* (first-time setup, onboarding) changes the label.

This is why you read the mistakes before adding data. You're not just adding more `onboarding_friction` examples — you're adding examples that specifically cover the pattern the model is getting wrong: **errors and failures that happen during first-time setup**.

---

## Step 3 — Make one change

The change: add 10 targeted `onboarding_friction` examples to `training/data/feedback.csv` where the onboarding experience involves something broken or confusing — errors, stuck steps, OAuth failures, blank screens during setup.

These have already been added to `training/data/feedback.csv` as part of this chapter's starting state. Open the file and look at the last 12 rows — you'll see 10 `onboarding_friction` examples and 2 `pricing_concern` examples (pricing was the second-weakest category).

**Why only one change:** If you add targeted data AND increase training epochs AND adjust the learning rate in the same run, you'll see a different number but you won't know what moved it. Maybe the extra examples helped. Maybe the extra epochs overfit. Maybe the learning rate change hurt `praise`. You can't tell. One variable per run means every result is interpretable.

> [!TIP]
> **Tradeoff:** Adding 10 specific examples for one failure mode is more efficient than adding 50 general examples across all categories. But it only works when you know exactly what the model is getting wrong and why. That's what the confusion matrix and mistake list gave you. Without that diagnosis, you'd be padding the dataset hoping something works — which is the slowest way to improve a model.

> [!IMPORTANT]
> **Customer impact:** With 10 new training examples teaching the model that errors-during-setup = `onboarding_friction`, you expect the model to correctly route those tickets to the right team. In practice at 340 tickets/Monday, even moving `onboarding_friction` F1 from 0.71 to 0.79 means roughly 3 more tickets per week reaching the onboarding team instead of the bug queue. Each one is a new user who described exactly what went wrong. That's the signal a growth team needs to fix the signup flow.

---

## Step 4 — Retrain

From the repo root:

```bash
python3 training/train.py
```

Or from the chapter folder:

```bash
cd chapters/06-tuning-loop
python3 train.py
```

Same 15–30 minutes. Same fixed eval waiting at the end.

---

## Step 5 — Run the fixed eval and compare

```bash
python3 training/score_eval.py --eval training/data/eval.csv
```

Look specifically at:
1. `onboarding_friction` F1 — did it improve?
2. Every other label F1 — did anything get worse?
3. Overall accuracy — directional signal only

Record the results in `training/experiment-log.md`:

```
| Run 1 | today | +10 onboarding_friction examples (error-during-setup pattern) | ??% | ... |
```

### What a good result looks like

`onboarding_friction` F1 improves by 0.05–0.10. No other label drops by more than 0.03. Overall accuracy stays flat or improves slightly.

### What a bad result looks like

`onboarding_friction` F1 improves but `bug_report` F1 drops by 0.07. This happens when the model shifts its decision boundary too far — it now calls more things `onboarding_friction` that are actually `bug_report`. The fix: check the confusion matrix again. If `bug_report → onboarding_friction` errors are now appearing, add a few more varied `bug_report` examples to rebalance.

### What an inconclusive result looks like

No significant change in either direction. This usually means the 10 examples weren't varied enough — they all looked too similar to examples already in training. Try different phrasings, different channel styles (Slack message vs. formal ticket), or examples from a different part of the onboarding funnel.

---

## When to stop tuning

Stop when one of these is true:

**Every label is above F1 = 0.80.** That's the threshold where you can describe the model's performance as "reliably good" across all five questions.

**The weakest label hasn't moved in three runs.** You've hit the ceiling for what more data can fix given the current label definitions. At this point, consider whether the label definition itself needs changing — not the data.

**Good enough for the use case.** This is a product decision. If your team is only acting on `bug_report` and `pricing_concern` right now, a model that performs well on those two and weakly on the others may be the right place to stop. Don't tune for academic completeness. Tune for the decisions you're actually making.

> [!TIP]
> **Tradeoff:** More tuning runs = a more accurate model, but each run costs 15–30 minutes and requires a human to read the output and decide what changed. At some point, the marginal improvement per run shrinks below the cost of running it. For a weekly Monday-morning classifier, two to three deliberate tuning cycles is usually enough to go from "rough baseline" to "reliable enough to act on." For a model making high-stakes decisions, you'd tune longer and more systematically.

---

## The habit

The pattern you just ran — record baseline → diagnose failure → make one targeted change → measure against the fixed eval — is the tuning habit. It applies to every model you'll ever build, regardless of the use case or the tool.

The instinct to keep changing things without measuring is strong, especially when the model is close to good. Resist it. One change, one run, one comparison. The experiment log is what keeps you from spending two hours improving a number that was already good enough.

---

## The story so far

Monday morning. 340 tickets. Five questions. You now have:
- A trained model that classifies feedback into five categories
- A fixed eval that tells you which categories it handles well and which it doesn't
- A tuning loop that lets you improve specific weaknesses deliberately
- An experiment log that makes every change legible

What you don't have yet: a way to run this automatically. Right now, you'd paste tickets into a script manually. In Chapter 07, you turn this model into a local endpoint — a service that accepts a ticket and returns a label in under a second, callable from TypeScript, ready to be wired into whatever workflow you actually use on Monday mornings.

---

**Next:** [Chapter 07 — Serve the model as a local endpoint](07-serve-the-model.md)
