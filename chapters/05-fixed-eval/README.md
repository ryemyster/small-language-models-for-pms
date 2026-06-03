# Chapter 05 — Starting Point

**Read first:** [docs/05-fixed-eval.md](../../docs/05-fixed-eval.md)

## What's in this folder

| File | Description |
|------|-------------|
| `data/feedback.csv` | 163 labeled examples |
| `data/bad_eval.csv` | Flawed eval from Chapter 04 |
| `data/eval.csv` | Fixed trustworthy eval — 100 examples, 20 per label, new this chapter |
| `train.py` | Training script |
| `score_eval.py` | Updated scorer with confusion matrix — new this chapter |
| `requirements.txt` | Python dependencies |

## Before you start

You need a trained model from Chapter 03 or 04. Run `python3 train.py` if you're starting here fresh.

## What you'll do in this chapter

- Run the bad eval side-by-side with the fixed eval
- Read precision, recall, F1, and the confusion matrix
- Record your baseline scores in the experiment log (coming in Chapter 06)
- Understand how evals work during development and in production

## Commands

```bash
# Run the bad eval (should look deceptively good)
python3 score_eval.py --eval data/bad_eval.csv

# Run the fixed eval (tells the truth)
python3 score_eval.py --eval data/eval.csv
```
