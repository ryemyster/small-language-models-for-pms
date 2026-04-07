"""
train.py — Fine-tune a small language model on customer feedback.

This script does four things:
  1. Picks a base model (one that already understands English)
  2. Loads and prepares the labeled training data
  3. Fine-tunes the model on that data
  4. Evaluates how well it performs and saves it for use

Run it with: python training/train.py
Expected time: 15–30 minutes on a laptop CPU. No GPU required.
"""

import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
)
import torch

# ─────────────────────────────────────────────
# CONSTANTS — the only things you need to change
# if you want to train on your own data.
# ─────────────────────────────────────────────

DATA_PATH = "training/data/feedback.csv"   # path to your labeled CSV
TEXT_COLUMN = "text"                        # column name for the input text
LABEL_COLUMN = "label"                      # column name for the category
OUTPUT_DIR = "training/model"              # where to save the trained model


# ─────────────────────────────────────────────
# ACT 1: Pick a base model
#
# A "base model" is a model that's already been trained on a massive amount
# of general text (books, websites, Wikipedia). It already understands English
# grammar, context, and meaning. We're not starting from scratch — we're
# teaching it YOUR specific categories on top of that foundation.
#
# Two questions narrow the choice:
#   1. Is it small enough to run on a laptop CPU?
#   2. Was it trained on enough general English to understand your data?
#
# distilbert-base-uncased answers yes to both:
#   - ~250MB — fits in RAM, runs on a normal laptop in reasonable time
#   - Trained on BooksCorpus + English Wikipedia — understands everyday English
#
# You can swap in a different model by changing BASE_MODEL below.
# Look on huggingface.co/models — filter by "text classification" and sort by downloads.
# ─────────────────────────────────────────────

BASE_MODEL = "distilbert-base-uncased"

print(f"\n=== Step 1: Loading base model ({BASE_MODEL}) ===")
print("This model already understands English. We're adding your categories on top.")


# ─────────────────────────────────────────────
# ACT 2: Load and prepare the data
#
# We load the CSV, assign each label a number (the model works with numbers,
# not strings), and split the data into training and test sets.
#
# Training set: what the model learns from.
# Test set: examples it has never seen, used to measure real accuracy.
# ─────────────────────────────────────────────

print(f"\n=== Step 2: Loading data from {DATA_PATH} ===")

df = pd.read_csv(DATA_PATH)

# Map string labels to integers (e.g. "bug_report" → 0, "feature_request" → 1)
# The model needs numbers, not words. We'll map back to words at prediction time.
labels = sorted(df[LABEL_COLUMN].unique().tolist())
label2id = {label: i for i, label in enumerate(labels)}
id2label = {i: label for i, label in enumerate(labels)}

df["label_id"] = df[LABEL_COLUMN].map(label2id)

print(f"Found {len(df)} examples across {len(labels)} categories:")
for label in labels:
    count = len(df[df[LABEL_COLUMN] == label])
    print(f"  {label}: {count} examples")

# Split into training (80%) and test (20%) sets
# stratify= ensures each category is proportionally represented in both splits
train_df, test_df = train_test_split(
    df, test_size=0.2, random_state=42, stratify=df["label_id"]
)

print(f"\nTraining on {len(train_df)} examples, testing on {len(test_df)} examples.")

# Convert to HuggingFace Dataset format (required by the Trainer)
train_dataset = Dataset.from_pandas(train_df[[TEXT_COLUMN, "label_id"]].rename(
    columns={"label_id": "labels"}
))
test_dataset = Dataset.from_pandas(test_df[[TEXT_COLUMN, "label_id"]].rename(
    columns={"label_id": "labels"}
))


# ─────────────────────────────────────────────
# ACT 3: Tokenize and fine-tune
#
# Tokenization: breaking text into pieces the model can process.
# The model doesn't read words — it reads tokens (roughly: parts of words).
# "onboarding" might become ["on", "##board", "##ing"].
#
# Fine-tuning: running training examples through the model, comparing its
# prediction to the correct label, and adjusting the model's internal numbers
# slightly in the direction of the right answer. Repeat ~3 times over all examples.
# ─────────────────────────────────────────────

print(f"\n=== Step 3: Tokenizing and fine-tuning ===")
print("This is the part that takes time. Go make a coffee.")

tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)

def tokenize(batch):
    # truncation=True: cut text that's too long for the model's input window
    # padding="max_length": pad short text so all inputs are the same length
    return tokenizer(batch[TEXT_COLUMN], truncation=True, padding="max_length", max_length=128)

train_dataset = train_dataset.map(tokenize, batched=True)
test_dataset = test_dataset.map(tokenize, batched=True)

# Load the base model with a classification head sized to our number of labels
model = AutoModelForSequenceClassification.from_pretrained(
    BASE_MODEL,
    num_labels=len(labels),
    id2label=id2label,
    label2id=label2id,
)

# Training configuration
# num_train_epochs=3: pass through the full training set 3 times
# per_device_train_batch_size=16: process 16 examples at a time (reduce to 8 if you run out of memory)
# learning_rate=2e-5: how much to adjust the model's numbers on each step (standard for fine-tuning)
# eval_strategy="epoch": check accuracy on the test set after each full pass through training data
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=3,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=16,
    learning_rate=2e-5,
    eval_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    logging_dir=os.path.join(OUTPUT_DIR, "logs"),
    logging_steps=10,
    report_to="none",   # disable Weights & Biases — we don't need external tracking
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=test_dataset,
    tokenizer=tokenizer,
)

trainer.train()

print("\nTraining complete. Saving model...")
trainer.save_model(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)
print(f"Model saved to {OUTPUT_DIR}/")


# ─────────────────────────────────────────────
# ACT 4: Evaluate honestly
#
# Accuracy alone doesn't tell the full story. A model can be 90% accurate
# overall but terrible on one specific category if that category has fewer examples.
#
# We print:
#   - Per-category precision, recall, and F1
#   - A confusion matrix showing where the model gets confused
#   - A few examples where the model got it wrong
#
# This is where you decide if the model is good enough to use.
# ─────────────────────────────────────────────

print("\n=== Step 4: Evaluating the model ===")

predictions = trainer.predict(test_dataset)
pred_ids = predictions.predictions.argmax(axis=-1)
true_ids = predictions.label_ids

pred_labels = [id2label[i] for i in pred_ids]
true_labels = [id2label[i] for i in true_ids]

print("\n--- Per-category results ---")
print("(Precision: when it predicts X, how often is it right?)")
print("(Recall: of all the actual X examples, how many did it catch?)")
print("(F1: the balance between the two — this is the main number to watch)\n")
print(classification_report(true_labels, pred_labels, target_names=labels))

print("\n--- Confusion matrix ---")
print("(Rows = actual label, Columns = predicted label)")
print("(Off-diagonal cells = where the model got confused)\n")
cm = confusion_matrix(true_labels, pred_labels, labels=labels)
header = " " * 22 + "  ".join(f"{l[:8]:>8}" for l in labels)
print(header)
for i, row in enumerate(cm):
    row_str = f"{labels[i]:<20}  " + "  ".join(f"{v:>8}" for v in row)
    print(row_str)

# Print the examples where the model was wrong
print("\n--- Examples the model got wrong ---")
test_texts = test_df[TEXT_COLUMN].tolist()
mistakes = [
    (text, true, pred)
    for text, true, pred in zip(test_texts, true_labels, pred_labels)
    if true != pred
]
if mistakes:
    for text, true, pred in mistakes[:10]:  # show up to 10 mistakes
        print(f"\n  Text:      {text[:80]}...")
        print(f"  Actual:    {true}")
        print(f"  Predicted: {pred}")
else:
    print("  No mistakes on the test set — that's either great or suspicious.")
    print("  If accuracy is 100%, your test set may be too small or too similar to training data.")

print("\n=== Done ===")
print(f"Model saved to: {OUTPUT_DIR}/")
print("Next step: start the classifier server with: npm run start")
