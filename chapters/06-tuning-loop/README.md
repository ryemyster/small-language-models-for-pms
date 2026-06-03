# Chapter 06 — Starting Point

**Read first:** [docs/06-tuning-loop.md](../../docs/06-tuning-loop.md)

## What's in this folder

| File | Description |
|------|-------------|
| `data/feedback.csv` | 175 labeled examples — includes 12 targeted additions for this chapter |
| `data/eval.csv` | Fixed eval — unchanged, used for every comparison |
| `train.py` | Training script |
| `score_eval.py` | Scorer with confusion matrix |
| `experiment-log.md` | Log template — fill in your baseline from Chapter 05 first |
| `requirements.txt` | Python dependencies |

## Before you start

1. Fill in your baseline scores from Chapter 05 in `experiment-log.md`
2. Run training on the updated `feedback.csv`:

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python3 train.py
```

## What you'll do in this chapter

- Study the confusion matrix from Chapter 05 to find the weakest label
- Understand why the model confuses `onboarding_friction` with `bug_report`
- Retrain on the updated training data (12 new targeted examples added)
- Run the fixed eval and compare before/after F1 scores
- Record the result in `experiment-log.md`

## Run eval after training

```bash
python3 score_eval.py --eval data/eval.csv
```

Compare `onboarding_friction` F1 against your Chapter 05 baseline.
