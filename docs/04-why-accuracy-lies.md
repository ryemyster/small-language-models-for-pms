# Chapter 04 — Why a High Accuracy Score Can Still Mean a Bad Model

## Before you start

**Your working folder for this chapter:** `chapters/04-why-accuracy-lies/`

Open your terminal and navigate there:

```bash
cd chapters/04-why-accuracy-lies
```

**✓ Confirm you're in the right place:**

```bash
ls
```

You should see:

```
README.md   data/   requirements.txt   score_eval.py   train.py
```

```bash
ls data/
```

You should see:

```
bad_eval.csv   feedback.csv
```

**You need a trained model before you can run anything in this chapter.** Check if it exists:

```bash
ls model/
```

**✓ If you see `model.safetensors`**, you're ready. Keep going.

**✗ If you see `No such file or directory`**, run training first:

```bash
python3 -m venv .venv
source .venv/bin/activate    # Mac/Linux — use .venv\Scripts\activate on Windows
pip install -r requirements.txt
python3 train.py
```

That takes 15–30 minutes. Come back when it says `=== Done ===`.

---

**What you'll do in this chapter:**
- Run a deliberately broken eval and see why the score looks fine
- Spot the three patterns that make an eval misleading
- Understand what a trustworthy eval actually needs

**What you'll have when you're done:**
- A clear understanding of why accuracy numbers can lie — and how to catch it

---

## The problem with the score from Chapter 03

Your model just printed a number. Maybe 82%. Maybe 91%. It looked reasonable.

Here's the problem: that number came from testing the model on 33 randomly chosen examples from the *same pool* it trained on. It's like giving a student a test made from questions on their own study guide. Of course they'll do well.

A trustworthy eval needs three things:
- **Separate** — never included in training, never seen during fine-tuning
- **Fixed** — the same set every time you test, so results are comparable across runs
- **Representative** — covering the full range of your real inbox: different tones, lengths, channel styles, and edge cases

You're building that in Chapter 05. First, you need to see what a bad eval looks like — so you can recognize one when you see it.

---

## Open the bad eval file

**Open `chapters/04-why-accuracy-lies/data/bad_eval.csv` in your text editor.**

Scroll through it. Count the rows. Notice what kinds of text appear. You should feel something is off before you even run it.

Now run it:

```bash
python3 score_eval.py --eval data/bad_eval.csv
```

**✓ You should see output that starts like this:**

```
=== Scoring against data/bad_eval.csv ===

Overall accuracy: 17/20 = 85%
```

85%. That looks decent. It isn't. Keep reading.

**✗ If you see `ModuleNotFoundError`**, your virtual environment isn't active. Run:

```bash
source .venv/bin/activate    # Mac/Linux
.venv\Scripts\activate       # Windows
```

Then try again.

---

## Read the full output carefully

After the accuracy line, you'll see per-label results:

```
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
```

Notice the warnings. Four of your five categories are flagged as unreliable. And `praise` has **zero examples** — one of your five Monday-morning questions was never tested at all.

The 85% overall number hides all of this.

---

## The three problems in this dataset

Look back at `bad_eval.csv` as you read each problem. You'll be able to spot each one.

---

### Problem 1: Rows copied from training data

**Open both files side by side:**
- `data/bad_eval.csv`
- `data/feedback.csv`

Find the first few rows of `bad_eval.csv`:

```
"The app crashes every time I try to export a report to PDF."
"Hi Support, I'm getting a 500 error every time I try to export a report to PDF..."
"CSV export producing scrambled column headers since last Tuesday."
```

Now search for those exact phrases in `feedback.csv`.

You'll find them. These rows were copied directly from training data. The model studied them. Getting them right isn't learning — it's memorization. It's like letting a student bring their homework to the exam and counting it as correct when they copy it.

**What this inflates:** Overall accuracy. The model gets easy points on examples it already knows, which pushes the number up before it even touches a new example.

**Pattern to watch for:** If your eval file shares any rows with your training file, your accuracy number is optimistic. Always verify zero overlap before trusting a score.

---

### Problem 2: Examples so obvious they prove nothing

Scroll further down `bad_eval.csv`. You'll find rows like:

```
"Something is broken." → bug_report
"It doesn't work." → bug_report
"Error." → bug_report
"Too expensive." → pricing_concern
"Add stuff." → feature_request
```

These are so vague that almost any classifier — including a keyword matcher — would get them right. They add to your accuracy count without testing whether the model can handle anything realistic.

Your real inbox doesn't look like this. It looks like:

```
"3/10 — Product is genuinely good but we're a nonprofit and the pricing isn't
sustainable. Reviewing alternatives at renewal."
```

That's a pricing concern — but it contains positive language, a score, and a churn signal all in one sentence. That's what the model needs to handle. That's what your eval needs to test.

**Pattern to watch for:** If every example in your eval is unambiguous and short, you're not testing the hard cases. Good evals include boundary cases, mixed signals, and realistic phrasing.

---

### Problem 3: Too few examples per label — especially for the failing ones

Look at the support column in the output:

```
bug_report           support: 10
feature_request      support: 3
onboarding_friction  support: 2
pricing_concern      support: 3
praise               support: 0
```

10 bug report examples. 2 onboarding friction examples. Zero praise.

Getting 2/2 on `onboarding_friction` tells you almost nothing. With two examples, the model could be right by chance. And if the model has a systematic blind spot with `praise` — maybe it confuses it with `feature_request` — this eval will never show it. You'd ship a broken model with no idea.

**Pattern to watch for:** Any category with fewer than 10 examples in your eval has an unreliable score. A missing category means you're flying blind on it entirely.

---

## Side by side: bad eval row vs. trustworthy eval row

| Label | Bad eval row | Trustworthy eval row |
|-------|---|---|
| `bug_report` | `"Error."` | `"Bulk delete says 'success' but nothing actually gets deleted. Tried on three different projects."` |
| `pricing_concern` | `"Too expensive."` | `"3/10 — Product is good but we're a nonprofit and can't sustain the pricing. Reviewing alternatives at renewal."` |
| `onboarding_friction` | `"Setup was confusing."` | `"I was invited by a colleague. Clicked the link and it sent me to the homepage, not her workspace."` |
| `feature_request` | `"Add stuff."` | `"On a call with a prospect — they specifically asked if we have Jira two-way sync. We don't. Worth prioritising."` |

The trustworthy rows are specific, realistic, and drawn from real inbox phrasing. They're harder. That's the point.

---

## What a high score on a bad eval actually tells you

Not much. Here's the breakdown:

- **Memorization:** the model got training examples right because it studied them, not because it generalized
- **Easy examples:** the model got obvious examples right because anything would
- **Missing categories:** the model's worst-performing label wasn't even tested

An accuracy number without knowing where those examples came from is not information. It's a feeling of confidence that hasn't been earned.

> [!TIP]
> **Tradeoff:** Building a thorough eval takes time before you start tuning. It's tempting to skip it and go straight to improving the model. The cost of skipping is that you tune blindly — you don't know if a change actually helped, hurt a specific category, or did nothing. The upfront investment in a real eval set pays back every time you retrain. Same tradeoff as skipping user research to ship faster: you move quicker in the short term and slower for every decision after that.

> [!IMPORTANT]
> **Customer impact:** A model that passes a flawed eval gets shipped. It mislabels tickets at the same rate as an untested model — you just don't know it yet. The PM's five Monday-morning questions get answered with corrupted data. Customers who took the time to write detailed feedback find that nothing changes — not because the team didn't care, but because the feedback was routed to the wrong pile by a model that looked fine on paper.

---

## What you just learned

Before moving on, make sure you can answer these:

- What are the three things that make an eval misleading?
- Why does testing on training data produce inflated accuracy?
- Why does having 2 examples for a label make that label's score meaningless?

---

**Next:** [Chapter 05 — Build a trustworthy fixed eval suite](05-fixed-eval.md)
