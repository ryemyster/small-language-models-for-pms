# Chapter 04 — Why Accuracy Lies

You're in the right place. Open the chapter guide and follow it:

→ **[docs/04-why-accuracy-lies.md](../../docs/04-why-accuracy-lies.md)**

---

## What's in this folder

**Carried from Chapter 03:**

| File | What it is |
|------|------------|
| `data/feedback.csv` | 163 labeled examples |
| `train.py` | Training script |
| `requirements.txt` | Python dependencies |

**New this chapter:**

| File | What it is |
|------|------------|
| `data/bad_eval.csv` | Intentionally flawed eval — you'll run it and see why the score is misleading |
| `score_eval.py` | Scores any labeled CSV against your trained model |

---

## You need a trained model

The doc will check for `model/` before you run anything. If it's missing, the doc tells you exactly how to generate it.
