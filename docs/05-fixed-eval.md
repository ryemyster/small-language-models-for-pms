# Chapter 05 — Evals: How to Know If Your Model Actually Works

## Before you start

**Your working folder for this chapter:** `chapters/05-fixed-eval/`

Open your terminal and navigate there:

```bash
cd chapters/05-fixed-eval
```

**✓ Confirm you're in the right place:**

```bash
ls
```

You should see:

```
README.md   data/   experiment-log.md   requirements.txt   score_eval.py   train.py
```

```bash
ls data/
```

You should see:

```
bad_eval.csv   eval.csv   feedback.csv
```

**Turn on the project's Python environment.** Every chapter shares the one setup created in the project root:

```bash
source ../../.venv/bin/activate       # Mac or Linux
```

```bash
..\..\.venv\Scripts\activate          # Windows (PowerShell)
```

**✓ If it worked**, you'll see `(.venv)` at the start of your terminal prompt.

**You need a trained model.** Check if it exists:

```bash
ls model/
```

**✓ If you see `model.safetensors`**, you're ready.

**✗ If you see `No such file or directory`**, copy the model from Chapter 04. The training data hasn't changed since Chapter 03, so there's no need to train again:

```bash
cp -r ../04-why-accuracy-lies/model .                       # Mac or Linux
```

```bash
Copy-Item -Recurse ..\04-why-accuracy-lies\model .         # Windows (PowerShell)
```

Run `ls model/` again. You should see `model.safetensors`.

**✗ If Chapter 04 doesn't have a model either** (you're starting here), train one in this folder with `python3 train.py`. Come back when it says `=== Done ===`.

---

**What you'll do in this chapter:**
- Run the bad eval and the fixed eval side by side — and see why the numbers look completely different
- Read F1 scores, precision, recall, and a confusion matrix for the first time
- Record your baseline scores — you'll need them in Chapter 06
- Understand how evals work differently once the model is live

**What you'll have when you're done:**
- A real, trustworthy accuracy score you can act on
- Your baseline recorded in the experiment log

---

## Why evals are the most important concept in this tutorial

Evals are not a formality. They are the thing that separates a model that works in a demo from one that works in production.

Training a model is easy — you run a script and wait. Knowing whether it actually works, and *why* it doesn't work when it doesn't — that's the hard part. Evals are how you answer that question in a way you can repeat, compare, and trust.

---

## Part 1: Run the bad eval

In Chapter 04, you read through the bad eval and spotted its problems. Now run it and see the number it produces.

```bash
python3 score_eval.py --eval data/bad_eval.csv
```

**✓ You should see:**

```
=== Scoring against data/bad_eval.csv ===

Overall accuracy: 16/20 = 80.0%
```

Pause here. 80%. That looks reasonable.

Now read what comes after it:

```
                     precision    recall  f1-score   support

         bug_report       1.00      0.70      0.82        10
    feature_request       1.00      1.00      1.00         5
onboarding_friction       0.40      1.00      0.57         2
             praise       0.00      0.00      0.00         0
    pricing_concern       1.00      0.67      0.80         3

  ⚠ 'onboarding_friction' has only 2 example(s) — score for this label is not reliable
  ⚠ 'praise' has only 0 example(s) — score for this label is not reliable
  ⚠ 'pricing_concern' has only 3 example(s) — score for this label is not reliable
```

`praise` has zero examples. `onboarding_friction` has two. Three rows were copied from training data, and a handful are one-word tickets nobody really writes. The 80% looks like information. It isn't.

**This is the failure mode that causes real teams to ship bad models.** Not because they didn't evaluate. Because they evaluated badly.

---

## Part 2: Run the fixed eval

Now run the eval that was built to avoid every one of those problems:

```bash
python3 score_eval.py --eval data/eval.csv
```

**✓ You should see something like this.** These are the numbers we got. Yours may differ by a few points depending on your computer, but the pattern should be the same.

```
=== Scoring against data/eval.csv ===

Overall accuracy: 85/100 = 85.0%

                     precision    recall  f1-score   support

         bug_report       0.79      0.95      0.86        20
    feature_request       0.86      0.90      0.88        20
onboarding_friction       0.81      0.65      0.72        20
             praise       0.94      0.80      0.86        20
    pricing_concern       0.86      0.95      0.90        20
```

80% on the bad eval. 85% on this one. The fixed eval scored *higher* — and it's still the only one of the two you should trust. The bad eval's number wasn't too optimistic or too pessimistic. It was noise: 20 rows, one label missing entirely, a few copied answers, and a few one-word tickets. Each of its rows swings the score by 5 points. Here's what's different about this eval:

- **100 examples, 20 per label** — enough to surface a real weakness in any category
- **Zero overlap with training data** — verified before it was built
- **Full channel variety** — formal tickets, Slack messages, NPS verbatims, app store reviews
- **Boundary cases** — examples that sit close to two labels, mixed signals, realistic ambiguity

---

## How to read the output

### F1 score — the number to watch

Three scores appear for each label: precision, recall, and F1. **Watch F1.** It's the one number that balances the other two.

| Term | What it means in plain English |
|------|-------------------------------|
| **Precision** | When the model says "this is a `pricing_concern`" — how often is it actually right? |
| **Recall** | Of all the actual `pricing_concern` tickets in the eval — how many did the model catch? |
| **F1** | The balance between the two. Higher = better. 1.0 is perfect, 0.0 is completely wrong. |

Compare your F1 scores across labels:

| Label | F1 | What it means |
|-------|----|---------------|
| `pricing_concern` | 0.90 | Strong — catches almost every pricing complaint |
| `feature_request` | 0.88 | Strong — a couple get mistaken for pricing |
| `bug_report` | 0.86 | Good — catches nearly every bug, but other tickets get pulled in too |
| `praise` | 0.86 | Good — when it says praise it's right, but it misses 1 in 5 |
| `onboarding_friction` | 0.72 | Weakest — misses 1 in 3, mostly to `bug_report` |

The overall 85% hides this spread. If you only looked at the top line, you'd think the model was performing uniformly. It isn't. Four labels sit between 0.86 and 0.90. `onboarding_friction` is 0.14 below the next one up. That's your problem.

---

### The confusion matrix

After the per-label results, you'll see a grid called the confusion matrix:

```
Confusion matrix:
(Rows = actual label, Columns = predicted label)

                       bug_repo  feature_  onboardi    praise  pricing_
bug_report                   19         1         0         0         0
feature_request               0        18         0         0         2
onboarding_friction           4         2        13         1         0
praise                        1         0         2        16         1
pricing_concern               0         0         1         0        19
```

**How to read it:**
- Each **row** is the actual label on a ticket
- Each **column** is what the model predicted
- Numbers on the **diagonal** (top-left to bottom-right) are correct predictions
- Numbers **off the diagonal** are mistakes

**Find the `onboarding_friction` row:**

```
onboarding_friction           4         2        13         1         0
```

13 correct. But 4 labeled as `bug_report`, 2 as `feature_request`, 1 as `praise`.

The pattern is clear: the model confuses onboarding friction with bug reports. It's not random — it's a specific failure. When a new user describes something going wrong while they're getting started ("the error message on the import screen," "the docs say to click a button that isn't there"), the model sees something broken and reaches for `bug_report`.

That's actionable. You know the exact fix. Chapter 06 is where you apply it.

---

### The mistakes list

After the confusion matrix, you'll see the specific tickets the model got wrong:

```
Mistakes (15/100):
  ...
  Text:      I'm on Windows and the keyboard shortcuts in the docs are all Mac shortcuts. No Windows eq
  Actual:    onboarding_friction
  Predicted: bug_report

  Text:      The error message on the import screen says 'invalid format' with no explanation of what f
  Actual:    onboarding_friction
  Predicted: bug_report
  ...
```

The script shows the first 10 mistakes. **Read every one.** Don't just look at the counts. The pattern — new users stuck on something that's wrong in the product or the docs, predicted as `bug_report` — is the model's current misunderstanding made visible.

Below the mistakes there's one more section, `Confidence check`. Skip it for now. You'll use it in Chapter 07 to decide when to trust the model on its own.

---

## Record your baseline scores

**Open `chapters/05-fixed-eval/experiment-log.md` in your text editor.**

Fill in Run 0 with the scores from your fixed eval. With our numbers, it looks like this:

```
| 0 (baseline) | today | Nothing — first training run | 85% | 0.86 | 0.88 | 0.72 | 0.86 | 0.90 | |
```

Fill in the F1 column for each label from your output. **Write this down before you move on.** Once you retrain in Chapter 06, these numbers are gone. You need them to prove that your changes actually helped. Chapter 06 will ask you to copy this row over.

> [!IMPORTANT]
> **This is not optional.** If you skip recording the baseline, you'll have no way to know in Chapter 06 whether your tuning improved anything. You'll just have a new number with nothing to compare it to.

---

## Part 3: Evals during development vs. evals in production

Everything above is about evaluating the model *before* you ship it. Once the model is live and classifying real tickets every Monday morning, evals shift to a different job.

### During development

**Question:** Is the model ready?

**Method:** Fixed eval, same 100 rows every time, F1 by label. The eval never changes. Your data and parameters change. The ruler stays constant.

### In production

**Question:** Is it still working?

**Method:** Once a month, pull 50 real classified tickets, label them yourself without looking at what the model said, run `score_eval.py` against them, compare F1 to your baseline.

Your inbox changes over time. New product features ship, creating new types of feedback the model has never seen. Customer language evolves. A pricing change creates a spike in `pricing_concern` tickets that look different from anything in training. The model doesn't know about any of this — it keeps predicting based on what it learned from 163 examples from before these changes happened.

Without an ongoing eval process, you won't notice degradation until someone on your team reads a batch of classified tickets and says "these labels look wrong."

> [!NOTE]
> **Your job:** Production monitoring is not a technical job. It's a product habit — the same way you'd check NPS after a launch or support volume after a pricing change. The model is part of your workflow now. A 30-minute monthly check is how you keep it trustworthy.

> [!IMPORTANT]
> **Customer impact:** When a model degrades silently, the customer experience degrades with it. A pricing complaint your model used to catch correctly gets mislabeled as `feature_request` after a product update introduces new pricing language the model has never seen. The pricing team stops hearing about a growing problem. Customers raise it repeatedly and see no response. From their side, it looks like the company isn't listening — when in reality, the signal is being lost in the classification layer before it ever reaches a human. Production evals are how you catch that before your customers feel it.

---

## Where you are now

You have two eval files and a scoring script that tells you the truth:

| File | Purpose | When to use it |
|------|---------|----------------|
| `data/bad_eval.csv` | Shows what a misleading eval looks like | Understanding what to avoid |
| `data/eval.csv` | Fixed, trustworthy baseline | After every training run |
| `score_eval.py` | Runs either eval against your model | Any time |

Your baseline scores are recorded. You know exactly which label is weakest (`onboarding_friction`, F1 = 0.72) and why (confused with `bug_report` on error-during-setup tickets).

Chapter 06 is where you fix it.

---

**Next:** [Chapter 06 — Tune the model deliberately](06-tuning-loop.md)
