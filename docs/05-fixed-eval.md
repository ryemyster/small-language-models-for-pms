# Chapter 05 — Evals: How to Know If Your Model Actually Works

Evals are the most important concept in this tutorial. Not training. Not the model architecture. Evals.

Here's why: training a model is easy. Knowing whether it works — and knowing *why* it doesn't work when it doesn't — is the hard part. Evals are how you answer that question in a way you can repeat, compare, and trust.

This chapter does four things:
1. Shows you what a bad eval looks like when you actually run it — including the score that makes it look fine
2. Builds a trustworthy eval and shows what that looks like when you run it
3. Explains how evals anchor the improvement loop during model development
4. Introduces how evals work differently once the model is in production — and points to where that gets built later

---

## Part 1: Run the bad eval and read the output

In Chapter 04, you saw *why* the bad eval is broken. Now run it and see what it actually produces.

```bash
python3 training/score_eval.py --eval training/data/bad_eval.csv
```

Here's what you'll see:

```
=== Scoring against training/data/bad_eval.csv ===

Overall accuracy: 17/20 = 85%

Per-label results:
(Precision: when it predicts X, how often is it right?)
(Recall: of all actual X examples, how many did it catch?)
(F1: the balance between the two — the number to watch)

                     precision  recall  f1-score  support
bug_report              0.91    1.00      0.95       10
feature_request         0.75    1.00      0.86        3
onboarding_friction     1.00    1.00      1.00        2
pricing_concern         1.00    0.67      0.80        3
praise                  0.00    0.00      0.00        0

⚠ 'praise' has only 0 example(s) — score for this label is not reliable
⚠ 'onboarding_friction' has only 2 example(s) — score for this label is not reliable
⚠ 'feature_request' has only 3 example(s) — score for this label is not reliable
⚠ 'pricing_concern' has only 3 example(s) — score for this label is not reliable

Mistakes (3/20):
...
=== Done ===
```

**85%. That looks decent.** It isn't.

Break down what this output is actually telling you:

- **`praise` has 0 examples.** The model's ability to handle positive feedback — one of your five Monday-morning questions — was not tested at all. If the model is systematically confusing `praise` with `feature_request`, this eval will never surface it.
- **`onboarding_friction` has 2 examples.** Getting both right by chance is entirely plausible. This score means nothing.
- **Half the rows are copied from training data.** The model studied them. Those correct answers are memorization, not learning.
- **The "hard" examples don't exist.** Every bug report is either trivially obvious ("Broken.") or copied from training. There's no NPS verbatim, no mixed-signal ticket, no boundary case.

The 85% is a number that makes you feel confident. It shouldn't. You'd ship a model with a blind spot in `praise`, an untested `onboarding_friction` category, and no idea how it performs on realistic inbox text — and this eval would have told you everything was fine.

**This is the failure mode that causes real teams to ship bad models.** Not because they didn't evaluate. Because they evaluated badly.

---

## Part 2: Build and run a trustworthy eval

The fixed eval at `training/data/eval.csv` was built to avoid every failure from Part 1:

- **Zero overlap with training data** — verified before committing, none of the 100 examples appear in `feedback.csv`
- **20 examples per label** — enough to surface a systematic weakness in any single category
- **Full channel variety** — formal Zendesk tickets, short Slack messages, NPS verbatims with scores, CS call notes, app store reviews; the same mix as your real inbox
- **Boundary cases included deliberately** — examples that sit close to two labels, mixed-signal tickets, realistic ambiguity

Run it:

```bash
python3 training/score_eval.py --eval training/data/eval.csv
```

Here's what a typical first-run output looks like:

```
=== Scoring against training/data/eval.csv ===

Overall accuracy: 81/100 = 81%

Per-label results:
(Precision: when it predicts X, how often is it right?)
(Recall: of all actual X examples, how many did it catch?)
(F1: the balance between the two — the number to watch)

                     precision  recall  f1-score  support
bug_report              0.88    0.90      0.89       20
feature_request         0.85    0.85      0.85       20
onboarding_friction     0.72    0.70      0.71       20
praise                  0.90    0.90      0.90       20
pricing_concern         0.78    0.75      0.76       20

Confusion matrix:
(Rows = actual label, Columns = predicted label)
(Numbers off the diagonal = where the model got confused)

                        bug_rep  feature  onboard    praise  pricing
bug_report                   18        0        1         0        1
feature_request               0       17        1         0        2
onboarding_friction           3        1       14         0        2
praise                        0        1        0        18        1
pricing_concern               1        1        3         0       15

Mistakes (19/100):

  Text:      I set up everything the documentation said and got a blank dashboard with no explanation...
  Actual:    onboarding_friction
  Predicted: bug_report

  Text:      The error message on the import screen says 'invalid format' with no explanation of what...
  Actual:    onboarding_friction
  Predicted: bug_report

  ... and 17 more
```

Now you have real information.

### Reading the per-label results

**Precision** answers: when the model says "this is a `pricing_concern`," how often is it right? Precision of 0.78 means it over-labels — roughly 1 in 5 times it calls something `pricing_concern`, it's wrong.

**Recall** answers: of all the actual `pricing_concern` tickets in the eval, how many did the model catch? Recall of 0.75 means it missed 25% of them — those tickets got labeled as something else.

**F1** is the one number to watch. It's the balance between precision and recall. A high F1 means the model is both accurate when it fires and comprehensive in coverage. Compare your F1 scores across labels:

| Label | F1 | What it means |
|-------|----|---------------|
| `praise` | 0.90 | Strong — model clearly recognises positive feedback |
| `bug_report` | 0.89 | Strong — the highest-volume category performs well |
| `feature_request` | 0.85 | Good — some confusion at boundaries |
| `pricing_concern` | 0.76 | Needs work — missing or mislabeling 1 in 4 |
| `onboarding_friction` | 0.71 | Weakest — systematic confusion with `bug_report` |

The overall 81% hides this spread. If you only looked at the top line, you'd think the model was performing uniformly. It isn't. `onboarding_friction` is your problem and `pricing_concern` is close behind.

### Reading the confusion matrix

Each row is the actual label. Each column is what the model predicted. The diagonal is correct. Off-diagonal is wrong.

Read the `onboarding_friction` row:

```
onboarding_friction    3    1    14    0    2
```

14 correct. But 3 labeled as `bug_report`, 2 labeled as `pricing_concern`, 1 labeled as `feature_request`.

The pattern is clear: the model confuses onboarding friction with bug reports. That's not random — it's a specific failure. Onboarding friction examples that describe something not working ("nothing appeared in the dashboard," "the error message on the import screen") look like bug reports to the model. It sees "error" and "nothing appeared" and reaches for `bug_report`.

That's actionable. You know the exact fix: add more training examples where a new user encounters something broken or confusing *during setup*, so the model learns to distinguish "broken during onboarding" from "broken in general."

### Reading the mistakes

Read every mistake. Look for the same wrong prediction appearing multiple times. Two `onboarding_friction` examples both predicted as `bug_report` in the top of the list isn't a coincidence — it's the model's current misunderstanding made visible.

Some mistakes will look reasonable on both sides. "I set up everything the documentation said and got a blank dashboard" is a legitimate ambiguity — is that an onboarding problem or a bug? That's a good candidate for a clarifying note in your label definitions ("blank dashboard during first-time setup = onboarding_friction, not bug_report").

---

## Part 3: Evals as the development loop anchor

Here's the key insight: you don't run an eval once. You run it every time you change anything.

The loop looks like this:

```
Train → Eval → Read failures → Add targeted training data → Retrain → Eval again → Compare
```

The eval is what makes this loop meaningful. Without it, "I added 15 more onboarding examples" is just a thing you did. You don't know if it helped, hurt, or did nothing. With the eval, you have a before and after:

```
Before: onboarding_friction F1 = 0.71
After:  onboarding_friction F1 = 0.79
```

That's measurable improvement. Or it might go the other way — sometimes adding data for one category accidentally hurts another because the model shifts its decision boundary. The eval catches that too.

**The eval stays fixed throughout the development loop.** That's the rule from Part 2, and it matters here: if you change the eval between runs, you lose the ability to compare. "The model got better" and "the test got easier" look identical if you can't hold the ruler constant.

This is how good ML teams work:
1. Establish the eval before tuning anything
2. Record the baseline scores
3. Make one change (more data, different hyperparameter, adjusted label definition)
4. Retrain, re-eval
5. Compare scores — not just overall accuracy, per-label F1
6. Keep the change if it improved the weak labels without hurting the strong ones
7. Discard it if it didn't, and try something else

You'll do this in Chapter 06. The eval you just built is the anchor for that loop.

**One change at a time.** This is the discipline that makes the loop work. If you add 30 training examples, change the number of training epochs, and fix three label definitions simultaneously, you won't know which change moved the needle. Change one thing. Measure. Repeat.

---

## Part 4: Evals after the model ships

Everything above is about evaluating the model *during development* — before you put it in front of real data. Once the model is live and classifying real inbox tickets every Monday morning, evals shift to a different job.

### What changes in production

During development, the question is: "Is the model ready?"

In production, the question is: "Is it still working?"

Your inbox changes. New product features ship, creating new types of feedback the model has never seen. Customer language evolves. A pricing change creates a spike in `pricing_concern` tickets that look different from anything in training. Your company enters a new market with different phrasing patterns.

The model doesn't know about any of this. It keeps predicting based on what it learned from 163 examples collected before these changes happened. Its accuracy will silently degrade — and without an ongoing eval process, you won't notice until someone on your team reads a batch of classified tickets and says "these labels look wrong."

### The production eval pattern

The lightweight version: once a month, pull 50 classified tickets at random from your real inbox, manually label them yourself, and run `score_eval.py` against them. If your F1 scores have dropped — especially on a specific label — that's the signal to add more training data and retrain.

This isn't a big process. It's 50 tickets, maybe two hours. But it's the difference between a model that's maintained and a model that quietly goes wrong.

The more advanced version — automated monitoring that flags drops in confidence scores, watches label distribution for unexpected shifts, and alerts you when the model starts behaving differently — is a real engineering investment. Worth it at scale. Not where you start.

### Why this matters for you as a PM

Evals aren't an ML concept. They're a product quality concept that happens to apply to ML.

Every product you've worked on has some version of this:
- A/B tests are evals — you're measuring whether a change improved an outcome
- Error monitoring is an eval — you're watching for regressions in a metric you care about
- NPS tracking is an eval — you're measuring customer perception on a fixed scale over time

The mental model is identical: define what "good" looks like, measure it consistently, use the measurement to decide what to change. The difference with ML models is that the output you're measuring is the model's label, not a user's click or a customer's score.

Once you've internalised the eval loop, you can apply it to any model you build — for any use case, in any company.

> [!IMPORTANT]
> **Customer impact:** When a model degrades silently, the customer experience degrades with it. A pricing complaint that your model used to catch correctly gets mislabeled as `feature_request` after a product update introduces new pricing language the model has never seen. The pricing team stops hearing about a growing problem. Customers raise it repeatedly and see no response. From their side, it looks like the company isn't listening — when in reality, the signal is being lost in the classification layer before it ever reaches a human. Production evals are how you catch that before your customers feel it.

### Where this gets built

The tutorial covers the development-time eval loop through Chapter 07. Production monitoring — how to sample real output, track label distribution over time, and know when to retrain — is covered in Chapter 09, the adapt-this-template capstone. If you're deploying this for real before you finish the tutorial, the short version is: sample 50 tickets monthly, label them yourself, run `score_eval.py`, look at F1 by label.

---

## Where you are now

You have two eval datasets and a scoring script that tells you the truth:

| File | Purpose | Use it when |
|------|---------|-------------|
| `training/data/bad_eval.csv` | Shows what a misleading eval looks like | Understanding what to avoid |
| `training/data/eval.csv` | Fixed, trustworthy baseline | Every train/retrain cycle |
| `training/score_eval.py` | Runs either eval against your model | After every training run |

Write down your baseline scores from the fixed eval. You'll need them in Chapter 06.

| Label | F1 (baseline) |
|-------|---------------|
| `bug_report` | _____ |
| `feature_request` | _____ |
| `onboarding_friction` | _____ |
| `praise` | _____ |
| `pricing_concern` | _____ |
| **Overall accuracy** | _____ |

**The story so far:** You trained a model, measured it honestly, and now know exactly where it fails and why. That's the state every PM should want before deciding what to fix. Chapter 06 is where you fix it — one deliberate change at a time.

---

**Next:** [Chapter 06 — Tune the model deliberately](06-tuning-loop.md)
