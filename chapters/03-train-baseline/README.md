# Chapter 03 — Train a First Rough Model

You're in the right place. Open the chapter guide and follow it:

→ **[docs/03-train-baseline.md](../../docs/03-train-baseline.md)**

---

## What's in this folder

**Carried from Chapter 02:**

| File | What it is |
|------|------------|
| `data/feedback.csv` | 163 labeled examples — Chapter 02 completed |

**New this chapter:**

| File | What it is |
|------|------------|
| `train.py` | The fine-tuning script |
| `requirements.txt` | Python packages the script needs |

---

## One thing to know about `model/`

The doc will have you run `python3 train.py`. That generates a `model/` folder here with the trained model inside. That folder is gitignored — it's too large to store in git and you can always regenerate it by running `train.py` again. Chapters 04+ need a trained model, so if you skip ahead, run `train.py` in that chapter's folder first.
