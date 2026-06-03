# Chapter 06 — Tune the Model Deliberately

You're in the right place. Open the chapter guide and follow it:

→ **[docs/06-tuning-loop.md](../../docs/06-tuning-loop.md)**

---

## What's in this folder

**Carried from Chapter 05:**

| File | What it is |
|------|------------|
| `data/eval.csv` | Fixed eval — unchanged, your ruler for every comparison |
| `data/bad_eval.csv` | Flawed eval reference |
| `train.py` | Training script |
| `score_eval.py` | Eval scorer |
| `requirements.txt` | Python dependencies |

**New this chapter:**

| File | What it is |
|------|------------|
| `data/feedback.csv` | 175 labeled examples — 12 targeted additions at the bottom |
| `experiment-log.md` | Log template — fill in your Chapter 05 baseline before retraining |

---

## The 12 new rows matter

Open `data/feedback.csv` and scroll to the bottom. The last 12 rows are the targeted additions the doc talks about — 10 for `onboarding_friction`, 2 for `pricing_concern`. The doc explains why each one was added and what pattern it targets.
