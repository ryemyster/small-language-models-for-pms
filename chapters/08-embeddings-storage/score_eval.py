"""
score_eval.py — Score a saved model against any labeled eval CSV.

Usage:
  python3 training/score_eval.py --eval training/data/bad_eval.csv
  python3 training/score_eval.py --eval training/data/eval.csv

The model must already be trained. Run training/train.py first if you
haven't yet.

Output: overall accuracy, per-label F1, confusion matrix, and the rows it got wrong.
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
from sklearn.metrics import classification_report, confusion_matrix
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

    # Per-label F1 and precision/recall
    all_labels = sorted(set(true_labels) | set(pred_labels))
    print("\nPer-label results:")
    print("(Precision: when it predicts X, how often is it right?)")
    print("(Recall: of all actual X examples, how many did it catch?)")
    print("(F1: the balance between the two — the number to watch)\n")
    report = classification_report(
        true_labels, pred_labels, labels=all_labels, zero_division=0
    )
    print(report)

    # Flag thin categories
    for label in all_labels:
        count = true_labels.count(label)
        if count < 5:
            print(f"  ⚠ '{label}' has only {count} example(s) — score for this label is not reliable")

    # Confusion matrix
    print("\nConfusion matrix:")
    print("(Rows = actual label, Columns = predicted label)")
    print("(Numbers off the diagonal = where the model got confused)\n")
    cm = confusion_matrix(true_labels, pred_labels, labels=all_labels)
    col_width = max(len(l) for l in all_labels) + 2
    header = " " * (col_width + 2) + "  ".join(f"{l[:8]:>8}" for l in all_labels)
    print(header)
    for i, row in enumerate(cm):
        row_str = f"{all_labels[i]:<{col_width}}  " + "  ".join(f"{v:>8}" for v in row)
        print(row_str)

    # Mistakes
    mistakes = [
        (text, true, pred)
        for text, true, pred in zip(texts, true_labels, pred_labels)
        if true != pred
    ]
    print(f"\nMistakes ({len(mistakes)}/{total}):")
    for text, true, pred in mistakes[:10]:
        print(f"\n  Text:      {text[:90]}")
        print(f"  Actual:    {true}")
        print(f"  Predicted: {pred}")
    if len(mistakes) > 10:
        print(f"\n  ... and {len(mistakes) - 10} more")

    print("\n=== Done ===")
    if accuracy > 0.85 and total < 30:
        print("Score looks high — but with fewer than 30 examples, it may not mean much.")
        print("Check per-label counts above.")


if __name__ == "__main__":
    main()
