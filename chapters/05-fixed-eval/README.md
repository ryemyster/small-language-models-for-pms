# Chapter 05 — Build a Fixed Eval Suite

You're in the right place. Open the chapter guide and follow it:

→ **[docs/05-fixed-eval.md](../../docs/05-fixed-eval.md)**

---

## What's in this folder

**Carried from Chapter 04:**

| File | What it is |
|------|------------|
| `data/feedback.csv` | 163 labeled examples |
| `data/bad_eval.csv` | Flawed eval from Chapter 04 |
| `train.py` | Training script |
| `score_eval.py` | Eval scorer |
| `requirements.txt` | Python dependencies |

**New this chapter:**

| File | What it is |
|------|------------|
| `data/eval.csv` | Fixed trustworthy eval — 100 examples, 20 per label, zero overlap with training |

---

## Record your baseline scores

After you run the fixed eval, write down the F1 score for each label. You'll need those numbers in Chapter 06 to prove your tuning actually helped.
