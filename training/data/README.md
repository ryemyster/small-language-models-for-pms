# Training Data

This folder holds the labeled feedback the classifier learns from, and the evals that test it.

| File | What it is | Rows |
|------|------------|------|
| `feedback.csv` | Training data: the examples the model studies | 175 |
| `eval.csv` | The fixed eval: 20 per label, never used in training (Chapter 05) | 100 |
| `bad_eval.csv` | A deliberately flawed eval, for Chapter 04 | 20 |

---

## What's in feedback.csv

`feedback.csv` has two columns:

- `text` — a piece of customer feedback (support ticket, Slack message, NPS comment, app store review)
- `label` — the category it belongs to

| Label | Meaning | Count |
|-------|---------|-------|
| `bug_report` | Something is broken or not working as expected | 40 |
| `feature_request` | A request for something the product doesn't currently do | 34 |
| `pricing_concern` | Feedback about cost, plan structure, or billing | 31 |
| `onboarding_friction` | Difficulty getting started or understanding the product | 40 |
| `praise` | Positive feedback, compliments, or recommendations | 30 |

The last 12 rows are the targeted additions from Chapter 06: 10 `onboarding_friction`, 2 `pricing_concern`. The Chapter 03–05 version, without them, has 163 rows.

All examples are synthetic — they were written to represent realistic patterns, not copied from real users.

---

## How to use your own data

Open `feedback.csv` in any spreadsheet app (Excel, Google Sheets) or a text editor.

Your data needs to follow the same format: a `text` column and a `label` column. Labels must be consistent — `bug_report` and `Bug Report` are different labels to the model.

Rules of thumb:
- Aim for 30–50 examples per label to start
- Labels should be mutually exclusive — if a piece of feedback could reasonably belong to two categories, pick the primary one
- Avoid labels that overlap heavily in their language — the model will struggle to tell them apart
- Build your fixed eval (`eval.csv`) before you train, with no rows shared with `feedback.csv`

Once your file is ready, save it as `feedback.csv` in this folder, replacing this file. Then re-run `python3 training/train.py` from the project root. [Chapter 09](../../docs/09-make-it-yours.md) walks through the whole adaptation.

---

## How many examples do I need?

This is the most common question. What we can say from this tutorial: with about 35 examples per label, the model scores 85–87% on the 100-row fixed eval.

- **Under about 30 per label:** Expect the model to memorize your examples instead of learning the pattern.
- **30–50 per label:** Enough for a working first model, like the one in this tutorial.
- **More than that:** Usually helps, but *targeted* examples help more than *more* examples. In Chapter 06, 12 rows aimed at one specific confusion lifted the weakest label from F1 0.72 to 0.82.

Your results depend on how distinct your categories are and how consistent your labeling is. The only way to know is to build a fixed eval and measure.
