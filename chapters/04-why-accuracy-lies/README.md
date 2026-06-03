# Chapter 04 — Starting Point

**Read first:** [docs/04-why-accuracy-lies.md](../../docs/04-why-accuracy-lies.md)

## What's in this folder

| File | Description |
|------|-------------|
| `data/feedback.csv` | 163 labeled examples — completed from Chapter 02 |
| `data/bad_eval.csv` | Intentionally flawed eval dataset — new this chapter |
| `train.py` | Training script (same as Chapter 03) |
| `score_eval.py` | Eval scoring script — new this chapter |
| `requirements.txt` | Python dependencies |

## Before you start

You need a trained model. If you haven't done Chapter 03 yet, run training first:

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python3 train.py
```

## What you'll do in this chapter

- Run the bad eval and see the misleading score
- Understand the three failure patterns
- Learn what a trustworthy eval needs to look like

## Run the bad eval

```bash
python3 score_eval.py --eval data/bad_eval.csv
```
