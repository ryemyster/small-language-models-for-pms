"""
score_eval.py — Score a saved model against any labeled eval CSV.

Usage:
  python3 training/score_eval.py --eval training/data/bad_eval.csv
  python3 training/score_eval.py --eval training/data/eval.csv

The model must already be trained. Run training/train.py first if you
haven't yet.

Output: overall accuracy, per-label accuracy, and the rows it got wrong.
"""

import sys
import os
import argparse

try:
    import accelerate  # noqa: F401
except ImportError:
    print("\n[ERROR] The 'accelerate' package is missing.")
    print("  Fix: pip install -r requirements.txt\n")
    sys.exit(1)

import pandas as pd
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_DIR = "training/model"
TEXT_COLUMN = "text"
LABEL_COLUMN = "label"


def load_model():
    if not os.path.exists(MODEL_DIR):
        print(f"\n[ERROR] No trained model found at {MODEL_DIR}/")
        print("  Fix: run python3 training/train.py first\n")
        sys.exit(1)
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
    model.eval()
    return tokenizer, model


def predict(texts, tokenizer, model):
    inputs = tokenizer(
        texts,
        truncation=True,
        padding=True,
        max_length=128,
        return_tensors="pt",
    )
    with torch.no_grad():
        logits = model(**inputs).logits
    predicted_ids = logits.argmax(dim=-1).tolist()
    return [model.config.id2label[i] for i in predicted_ids]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--eval", required=True, help="Path to labeled eval CSV")
    args = parser.parse_args()

    if not os.path.exists(args.eval):
        print(f"\n[ERROR] Eval file not found: {args.eval}\n")
        sys.exit(1)

    print(f"\n=== Loading model from {MODEL_DIR}/ ===")
    tokenizer, model = load_model()
    labels = list(model.config.label2id.keys())

    print(f"\n=== Scoring against {args.eval} ===")
    df = pd.read_csv(args.eval)
    texts = df[TEXT_COLUMN].tolist()
    true_labels = df[LABEL_COLUMN].tolist()
    pred_labels = predict(texts, tokenizer, model)

    correct = sum(t == p for t, p in zip(true_labels, pred_labels))
    total = len(true_labels)
    accuracy = correct / total

    print(f"\nOverall accuracy: {correct}/{total} = {accuracy:.1%}")

    # Per-label breakdown
    print("\nPer-label accuracy:")
    for label in sorted(set(true_labels)):
        label_rows = [(t, p) for t, p in zip(true_labels, pred_labels) if t == label]
        label_correct = sum(t == p for t, p in label_rows)
        print(f"  {label:<22} {label_correct}/{len(label_rows)}", end="")
        if len(label_rows) < 5:
            print(f"  ← only {len(label_rows)} example(s) — not enough to trust this number", end="")
        print()

    # Mistakes
    mistakes = [
        (text, true, pred)
        for text, true, pred in zip(texts, true_labels, pred_labels)
        if true != pred
    ]
    print(f"\nMistakes: {len(mistakes)}/{total}")
    for text, true, pred in mistakes[:10]:
        print(f"\n  Text:      {text[:80]}")
        print(f"  Actual:    {true}")
        print(f"  Predicted: {pred}")

    print("\n=== Done ===")
    if accuracy > 0.85:
        print("Score looks good — but check how many examples are in each category above.")
        print("A high score with 2 examples per label means almost nothing.")


if __name__ == "__main__":
    main()
