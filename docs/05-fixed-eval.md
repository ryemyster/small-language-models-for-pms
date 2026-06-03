# Chapter 05 — Build a Trustworthy Fixed Eval Suite

In Chapter 04, you saw three ways an eval can lie. Now you're going to build one that doesn't.

The fixed eval suite is the ruler for this model. Every time you retrain, change your data, or tweak a setting, you run the same eval against it and compare the result. If the ruler changes between measurements, you can't tell whether the model improved or the test got easier. The eval stays fixed. The model changes. That's what makes the comparison meaningful.

---

## What makes this eval trustworthy

The fixed eval at `training/data/eval.csv` was built with four rules:

**1. Zero overlap with training data.**
None of the 100 examples in the eval appear in `training/data/feedback.csv`. The model has never seen them. This tests generalization, not memorization.

**2. Every label is represented equally.**
20 examples per category. That's enough to surface a systematic weakness in any single label — not just the average.

**3. Full channel variety.**
Formal Zendesk tickets, short Slack messages, NPS verbatims with scores, CS call notes, app store reviews. The same variety as your real inbox, not just the easy cases.

**4. Hard cases are included deliberately.**
Some examples sit close to a category boundary. A billing error that could be `bug_report` or `pricing_concern`. A setup problem that could be `onboarding_friction` or `bug_report`. A glowing review that mentions one missing feature. These are the cases where your model earns its score — or doesn't.

---

## Run the eval

```bash
python3 training/score_eval.py --eval training/data/eval.csv
```

The model must be trained first. If you haven't run Chapter 03 yet, do that now.

The script prints four things. Here's what each one tells you.

---

### Overall accuracy

```
Overall accuracy: 81/100 = 81%
```

The percentage of all 100 examples the model labeled correctly. This is the headline number. But by itself, it hides too much. Read on.

---

### Per-label results

```
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
```

This is where the real information lives.

**Precision** answers: when the model says "this is a `pricing_concern`," how often is it right? A precision of 0.78 means it's wrong about 22% of the time — it's over-labeling some things as `pricing_concern` that aren't.

**Recall** answers: of all the actual `pricing_concern` tickets in the eval, how many did the model catch? A recall of 0.75 means it missed 25% of them — those tickets got labeled as something else.

**F1** is the number to watch. It's the balance between precision and recall. A high F1 means the model is both accurate when it fires and comprehensive in coverage. A low F1 on a specific label is a flag: the model has a real weakness there.

In the example above, `onboarding_friction` has the lowest F1 (0.71). That's your tuning target for Chapter 06.

**Why overall accuracy hides this:**
If 81 out of 100 examples are correct overall, that sounds decent. But that 81 includes 20 `praise` examples where the model scored 90%, pulling the average up. The `onboarding_friction` weakness is buried. Without per-label scores, you'd ship a model with a blind spot and not know it.

---

### Confusion matrix

```
Confusion matrix:
(Rows = actual label, Columns = predicted label)
(Numbers off the diagonal = where the model got confused)

                        bug_rep  feature  onboard    praise  pricing
bug_report                   18        0        1         0        1
feature_request               0       17        1         0        2
onboarding_friction           3        1       14         0        2
praise                        0        1        0        18        1
pricing_concern               1        1        3         0       15
```

Read this row by row. Each row is an actual label. Each column is what the model predicted.

The diagonal (top-left to bottom-right) is where the model was right. Off-diagonal numbers are mistakes. Reading the `onboarding_friction` row:

- 14 correctly labeled `onboarding_friction`
- 3 incorrectly labeled `bug_report`
- 1 incorrectly labeled `feature_request`
- 2 incorrectly labeled `pricing_concern`

The pattern: the model is confusing `onboarding_friction` with `bug_report`. That's not random. It means some of your onboarding friction examples look like bug reports to the model — probably the ones where a new user describes something not working during setup. The model sees "error" and "nothing appeared" and reaches for `bug_report` instead of `onboarding_friction`.

That's a tunable problem. You know exactly what to add in Chapter 06: more `onboarding_friction` examples that involve broken or confusing experiences during setup, so the model learns to distinguish "broken during onboarding" from "broken in general."

---

### Mistakes

```
Mistakes (19/100):

  Text:      I set up everything the documentation said and got a blank dashboard with no explanation of...
  Actual:    onboarding_friction
  Predicted: bug_report

  Text:      The error message on the import screen says 'invalid format' with no explanation of what...
  Actual:    onboarding_friction
  Predicted: bug_report
```

Read every mistake. They're not random noise — they're the model's current misunderstanding made concrete. Two things to look for:

**Systematic patterns** — if the same kind of mistake appears three or four times, that's a signal. The fix is more targeted training examples, not a full retrain.

**Genuine ambiguity** — some mistakes will look reasonable. "The billing portal shows my card as expired but it doesn't expire until next year" really could be a bug or a billing concern. If you'd hesitate yourself, the model's confusion is understandable. These are good candidates for an explicit labeling decision in your style guide.

---

## Why the eval stays fixed

You'll retrain this model in Chapter 06. When you do, you'll run this same eval again and compare the results.

If you changed the eval between runs — added easier examples, removed hard ones, adjusted the label on an ambiguous row — you'd lose the ability to compare. Did the model improve, or did the test get easier? You wouldn't know.

The eval is the ruler. Once you've built it, don't touch it. If you discover the eval itself has a problem (a mislabeled row, a duplicate you missed), fix it once, document the fix, and treat that as a new baseline going forward.

---

## The model's current state

You now have a score you can trust. Not a score that makes you feel good — a score that tells you the truth.

Write it down. Label, F1, overall accuracy. This is your baseline. Everything you do in Chapter 06 is measured against it.

| Metric | Value |
|--------|-------|
| Overall accuracy | _(your number)_ |
| Weakest label (F1) | _(your label and score)_ |
| Most common confusion | _(X predicted as Y, N times)_ |

**The story so far:** You have a model. You have a real measurement of how well it works. You know exactly where it fails and why. That's more than most teams have when they ship.

On Monday morning, this model would correctly sort about 80 of your 100 test tickets. That's not good enough to trust yet — especially for `onboarding_friction` and `pricing_concern`. Chapter 06 fixes that.

---

**Next:** [Chapter 06 — Tune the model deliberately](06-tuning-loop.md)
