# Chapter 06 — Tune the Model Deliberately

## Before you start

**Your working folder for this chapter:** `chapters/06-tuning-loop/`

Open your terminal and navigate there:

```bash
cd chapters/06-tuning-loop
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

**You need the Chapter 05 baseline.** Check whether this folder has it:

```bash
ls model/
```

**✓ If you see `model.safetensors`**, you're ready.

**✗ If the model folder is missing**, check whether you finished Chapter 05:

```bash
ls ../05-fixed-eval/model/
```

**✓ If you see `model.safetensors` there**, copy it into this folder:

```bash
cp -r ../05-fixed-eval/model .                       # Mac or Linux
```

```bash
Copy-Item -Recurse ..\05-fixed-eval\model .         # Windows (PowerShell)
```

Run `ls model/` again. You should see `model.safetensors`.

> [!IMPORTANT]
> **Don't train in this folder yet.** This folder's `data/feedback.csv` already has the 12 tuning examples this chapter is about. Training now would skip the "before" measurement, and before vs. after is the whole point of this chapter.

**✗ If Chapter 05 has no model either** (you skipped it), you can still do this chapter using the guide's baseline. Run 0 in this folder's `experiment-log.md` is already filled in with the numbers we got in Chapter 05, and this doc shows the output they came from. You'll skip measuring the baseline yourself and go straight to diagnosing and retraining.

> [!WARNING]
> **The guide's baseline makes your before-vs-after comparison rougher.** Your "after" will come from your computer. Our "before" came from ours, and that difference alone can move scores by a few points ([why](getting_started.md#your-numbers-wont-match-ours-exactly--and-thats-expected)). Treat changes of 2–3 points as noise. For a clean comparison, train your own baseline first. It takes about a minute:
>
> ```bash
> cd ../05-fixed-eval
> python3 train.py
> cd ../06-tuning-loop
> ```
>
> Then run the copy command above.

---

**What you'll do in this chapter:**
- Record your baseline scores before touching anything
- Identify the weakest label and understand *why* it's failing — not just *that* it's failing
- Add targeted training examples and retrain
- Measure the before vs. after difference on the fixed eval

**What you'll have when you're done:**
- A model that performs measurably better on the weakest category
- A completed first entry in your experiment log
- The tuning habit: one change, one measurement, one comparison

---

## The only rule before you change anything

**Write down your baseline scores first.**

**Open `chapters/06-tuning-loop/experiment-log.md` in your text editor.**

Run 0 is already filled in with the guide's numbers. The Date column says `guide` so it's clear where they came from:

```
| 0 (baseline) | guide | Nothing — first training run | 85% | 0.86 | 0.88 | 0.72 | 0.86 | 0.90 | Guide's numbers ... |
```

**Ran Chapter 05?** Replace Run 0 with your row from `chapters/05-fixed-eval/experiment-log.md`. Didn't write it down? The model in this folder is still the baseline, so run the fixed eval now and use those numbers:

```bash
python3 score_eval.py --eval data/eval.csv
```

**Using the guide's baseline?** Leave Run 0 as it is. When this doc says "your output" in Steps 1 and 2, use the output shown in this doc instead.

**Save the file.** Once you retrain, the baseline is gone. If you don't write it down first, you have no way to prove your changes helped.

> [!NOTE]
> **Your job:** The experiment log is the model's changelog. Without it, "the model got better" is a feeling. With it, it's a fact: `onboarding_friction` F1 went from 0.72 to 0.82 on the fixed eval after adding 12 targeted examples. That's a sentence you can put in a team update or a case for investing more time.

---

## Step 1 — Find the target

Look at your baseline F1 scores. You're looking for two things:

**Lowest F1 by label.** That's your weakest category. In our output from Chapter 05, it's `onboarding_friction` at F1 = 0.72.

**Most common confusion in the matrix.** The `onboarding_friction` row showed:

```
onboarding_friction           4         2        13         1         0
```

Four `onboarding_friction` tickets predicted as `bug_report`. That's a pattern, not noise.

> [!NOTE]
> **Your job:** Choosing what to fix first is a prioritization decision, not a technical one. The right choice depends on which failure costs more. If your product team is actively working on an onboarding redesign, getting `onboarding_friction` right matters more this week. If pricing is a board-level concern, fix that first. The eval gives you the data. You make the call.

> [!IMPORTANT]
> **Customer impact:** `onboarding_friction` mislabeled as `bug_report` means new users who hit a wall during setup get routed to the bug queue — not the growth or onboarding team. Engineers see the ticket. Nobody looks at the signup flow. New users keep hitting the same wall. Every week the model runs with this confusion, that failure compounds.

---

## Step 2 — Understand *why* the model is wrong

This is the step most people skip. Don't skip it.

Scroll to the mistakes section of your eval output. Find the `onboarding_friction` failures:

```
Text:      I'm on Windows and the keyboard shortcuts in the docs are all Mac shortcuts. No Windows eq
Actual:    onboarding_friction
Predicted: bug_report

Text:      The error message on the import screen says 'invalid format' with no explanation of what f
Actual:    onboarding_friction
Predicted: bug_report
```

Read them carefully. The pattern is specific: onboarding friction examples that describe something *not working while a new user gets started* — an error, wrong instructions, a stuck step — look like bug reports to the model. Words like "error," "doesn't work," "wrong" appear in bug reports too. The model learned those words as bug signals and doesn't yet have enough signal that the *context* (first-time setup, onboarding) changes the label.

You're not just adding more `onboarding_friction` examples. You're adding examples that specifically cover the pattern the model is getting wrong: **errors and failures that happen during first-time setup.**

---

## Step 3 — Open the training data and look at it

**Open `chapters/06-tuning-loop/data/feedback.csv` in your text editor.**

Scroll to the bottom. The last 12 rows of this file are tuning additions — they were added specifically for this chapter:

- 10 new `onboarding_friction` examples where the onboarding experience involves something broken: errors, stuck steps, OAuth failures, blank screens during setup
- 2 new `pricing_concern` examples about plan limits a new user runs into during signup or a trial. These keep the model from swinging too far: not every surprise during setup is onboarding friction. Sometimes it's a pricing problem.

**Read those 10 `onboarding_friction` rows carefully.** Notice how each one describes something that *isn't working* — but in the context of a new user's first experience, not a general product bug.

This is what targeted training data looks like. You're not padding the dataset — you're teaching the model the specific pattern it's getting wrong.

> [!TIP]
> **Tradeoff:** Adding 10 specific examples for one failure mode is more efficient than adding 50 general examples. But it only works when you know exactly what the model is getting wrong and *why*. That's what the confusion matrix and mistakes list gave you. Without that diagnosis, you'd be padding the dataset hoping something works — which is the slowest way to improve a model.

---

## Step 4 — Retrain with one change

The only change between Run 0 and Run 1 is those 12 targeted examples. Nothing else.

Run training:

```bash
python3 train.py
```

**✓ Wait for `=== Done ===`.** About a minute on a recent laptop, longer on an older one.

**Why only one change:** If you add targeted data AND increase training epochs AND adjust the learning rate in the same run, you'll see a different number but won't know what moved it. Maybe the extra examples helped. Maybe the extra epochs overfit. Maybe the learning rate change hurt `praise`. You can't tell. One variable per run means every result is interpretable.

---

## Step 5 — Run the fixed eval and compare

```bash
python3 score_eval.py --eval data/eval.csv
```

Look at three things specifically:

1. `onboarding_friction` F1 — did it improve?
2. Every other label F1 — did anything get worse?
3. Overall accuracy — directional signal only, not the main measure

Record in your experiment log:

```
| 1 | today | +12 targeted examples (10 onboarding_friction error-during-setup, 2 pricing_concern) | ??% | ... |
```

### What a good result looks like

`onboarding_friction` F1 improves by 0.05–0.10. No other label drops by more than 0.03. Overall accuracy stays flat or improves slightly.

### What we got

When we ran it:

| Run | Overall | bug_report | feature_request | onboarding_friction | praise | pricing_concern |
|-----|---------|-----------|-----------------|---------------------|--------|-----------------|
| 0 (baseline) | 85% | 0.86 | 0.88 | 0.72 | 0.86 | 0.90 |
| 1 (+12 examples) | 87% | 0.89 | 0.85 | **0.82** | 0.89 | 0.90 |

`onboarding_friction` went up 0.10. `feature_request` dipped 0.03. Everything else held or improved. That's a good result. Not every miss got fixed, though: the "invalid format" ticket is still labeled `bug_report`. Your numbers may differ by a few points, but the direction should match.

### What a bad result looks like

`onboarding_friction` F1 improves but `bug_report` F1 drops by 0.07. This happens when the model shifts its decision boundary too far — it now calls more things `onboarding_friction` that are actually `bug_report`. Look at the confusion matrix: if `bug_report → onboarding_friction` errors are now appearing, add a few more varied `bug_report` examples to rebalance.

### What an inconclusive result looks like

No significant change in either direction. The 10 examples probably weren't varied enough — they all looked too similar to examples already in training. Try different phrasings, different channel styles (Slack message vs. formal ticket), or examples from a different part of the onboarding funnel.

---

## When to stop tuning

Stop when one of these is true:

**Every label is above F1 = 0.80.** That's the threshold where you can describe the model's performance as reliably good across all five questions.

**The weakest label hasn't moved in three runs.** You've hit the ceiling for what more data can fix given the current label definitions. At this point, consider whether the label definition itself needs changing — not the data.

**Good enough for the use case.** If your team is only acting on `bug_report` and `pricing_concern` right now, a model that performs well on those two may be the right place to stop. Don't tune for academic completeness. Tune for the decisions you're actually making.

> [!TIP]
> **Tradeoff:** More tuning runs = more accurate model, but each run costs training time (about a minute here, much longer with a bigger dataset) and requires a human to read the output. At some point, the marginal improvement per run shrinks below the cost of running it. For a weekly Monday-morning classifier, two to three deliberate tuning cycles is usually enough to go from "rough baseline" to "reliable enough to act on."

---

## The tuning habit

The pattern you just ran — record baseline → diagnose failure → make one targeted change → measure against the fixed eval — is the tuning habit. It applies to every model you'll ever build, regardless of the use case.

The instinct to keep changing things without measuring is strong, especially when the model is close to good. Resist it. One change, one run, one comparison. The experiment log is what keeps you from spending two hours improving a number that was already good enough.

---

## The story so far

Monday morning. 340 tickets. Five questions. You now have:
- A trained model that classifies feedback into five categories
- A fixed eval that tells you which categories it handles well and which it doesn't
- A tuning loop that lets you improve specific weaknesses deliberately
- An experiment log that makes every change legible

What you don't have yet: a way to run this automatically. Right now, you'd paste tickets into a script manually. In Chapter 07, you turn this model into a local API endpoint — callable from TypeScript, ready to wire into any workflow.

---

**Next:** [Chapter 07 — Serve the model as a local endpoint](07-serve-the-model.md)
