# Training Data

This folder contains the labeled feedback examples used to fine-tune the classifier.

---

## What's in feedback.csv

`feedback.csv` has two columns:

- `text` — a piece of customer feedback (support ticket, NPS comment, survey response)
- `label` — the category it belongs to

There are ~200 rows across five categories:

| Label | Meaning | Count |
|-------|---------|-------|
| `bug_report` | Something is broken or not working as expected | ~40 |
| `feature_request` | A request for something the product doesn't currently do | ~40 |
| `pricing_concern` | Feedback about cost, plan structure, or billing | ~30 |
| `onboarding_friction` | Difficulty getting started or understanding the product | ~30 |
| `praise` | Positive feedback, compliments, or recommendations | ~30 |

All examples are synthetic — they were written to represent realistic patterns, not copied from real users.

---

## How to use your own data

Open `feedback.csv` in any spreadsheet app (Excel, Google Sheets) or a text editor.

Your data needs to follow the same format: a `text` column and a `label` column. Labels must be consistent — `bug_report` and `Bug Report` are different labels to the model.

Rules of thumb:
- At least 50 examples per label, ideally 100+
- More examples = more accurate model, up to a point
- Labels should be mutually exclusive — if a piece of feedback could reasonably belong to two categories, pick the primary one
- Avoid labels that overlap heavily in their language — the model will struggle to tell them apart

Once your file is ready, save it as `feedback.csv` in this folder, replacing this file. Then re-run `python training/train.py`.

---

## How many examples do I need?

This is the most common question. The honest answer:

- **Under 50 per label:** Don't bother. The model will memorize your examples instead of learning the pattern.
- **50–100 per label:** Workable for a proof of concept. Expect ~80% accuracy.
- **100–200 per label:** Good. Expect ~88–92% accuracy on new inputs.
- **200+ per label:** Strong. Accuracy improvements beyond this point tend to be marginal for this type of task.

The accuracy numbers above are rough. Your actual results depend on how distinct your categories are and how consistent your labeling is.
