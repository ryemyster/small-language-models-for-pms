"""
score_eval.py — Score a saved model against any labeled eval CSV.

Usage:
  python3 score_eval.py --eval data/eval.csv                     (inside a chapter folder)
  python3 training/score_eval.py --eval training/data/eval.csv   (from the project root)

The model must already be trained. Run train.py first if you haven't yet.
It's loaded from model/ next to this file, wherever you run the script from.

Output: overall accuracy, per-label F1, confusion matrix, the rows it got wrong,
and a confidence check (how accurate the model is above different confidence levels).
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

# The model lives next to this file (training/model at the root, model/ in a chapter).
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model")
MODEL_DIR_SHOWN = os.path.relpath(MODEL_DIR)
TEXT_COLUMN = "text"
LABEL_COLUMN = "label"


def load_model():
    if not os.path.exists(MODEL_DIR):
        print(f"\n[ERROR] No trained model found at {MODEL_DIR_SHOWN}/")
        print("  Fix: run train.py first (it's in the same folder as this script)\n")
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
    # Confidence = the probability the model gives its winning label (softmax turns
    # raw scores into probabilities that add up to 1 across the five labels).
    confidences, predicted_ids = torch.softmax(logits, dim=-1).max(dim=-1)
    labels = [model.config.id2label[i] for i in predicted_ids.tolist()]
    return labels, confidences.tolist()


# Confidence levels to check. "Auto-label at or above this, send the rest to a person."
THRESHOLDS = [0.0, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]


def print_confidence_check(true_labels, pred_labels, confidences):
    total = len(true_labels)
    print("\nConfidence check:")
    print("(If you only auto-labeled tickets at or above a confidence level,")
    print(" how many would be labeled, and how often would those labels be right?)\n")
    print(f"  {'Confidence':<12}{'Auto-labeled':<15}{'Right':<8}{'Accuracy':<11}Sent to a person")
    for threshold in THRESHOLDS:
        kept = [(t, p) for t, p, c in zip(true_labels, pred_labels, confidences) if c >= threshold]
        right = sum(t == p for t, p in kept)
        level = "any" if threshold == 0 else f">= {threshold:.0%}"
        accuracy = f"{right / len(kept):.0%}" if kept else "—"
        print(f"  {level:<12}{f'{len(kept)}/{total}':<15}{right:<8}{accuracy:<11}{total - len(kept)}")
    print("\n  Pick the lowest level whose accuracy you'd accept. Everything below it goes to a person.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--eval", required=True, help="Path to labeled eval CSV")
    args = parser.parse_args()

    if not os.path.exists(args.eval):
        print(f"\n[ERROR] Eval file not found: {args.eval}\n")
        sys.exit(1)

    print(f"\n=== Loading model from {MODEL_DIR_SHOWN}/ ===")
    tokenizer, model = load_model()
    labels = list(model.config.label2id.keys())

    print(f"\n=== Scoring against {args.eval} ===")
    df = pd.read_csv(args.eval)
    texts = df[TEXT_COLUMN].tolist()
    true_labels = df[LABEL_COLUMN].tolist()
    pred_labels, confidences = predict(texts, tokenizer, model)

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

    print_confidence_check(true_labels, pred_labels, confidences)

    print("\n=== Done ===")
    if accuracy > 0.85 and total < 30:
        print("Score looks high — but with fewer than 30 examples, it may not mean much.")
        print("Check per-label counts above.")


if __name__ == "__main__":
    main()
