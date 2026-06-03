# Chapter 03 — Starting Point

**Read first:** [docs/03-train-baseline.md](../../docs/03-train-baseline.md)

## What's in this folder

| File | Description |
|------|-------------|
| `data/feedback.csv` | 163 labeled examples — completed work from Chapter 02 |
| `train.py` | The fine-tuning script |
| `requirements.txt` | Python dependencies |

## What you'll do in this chapter

- Install dependencies and run the training script
- Understand what's happening during each step
- Read the output numbers and know what they mean

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate      # Mac/Linux — use .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

## Run training

```bash
python3 train.py
```

Takes 15–30 minutes on a laptop CPU. The trained model saves to `model/` (gitignored — regenerate any time by re-running this script).

## Note on the model artifact

`model/` is gitignored and not included here. Chapters 04+ that depend on a trained model require you to run `train.py` in this folder first.
