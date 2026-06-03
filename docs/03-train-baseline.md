# Chapter 03 — Train a First Rough Model

You have 163 labeled examples. The model has never seen them. That's about to change.

This chapter runs the training script and explains every step — what the computer is doing, why it's doing it, and what the numbers mean when it's done. By the end, your laptop will have a working model that can sort feedback into the five categories. It won't be perfect. That's expected. This is the first draft.

---

## Before you run anything

Make sure you've completed setup from [docs/getting_started.md](getting_started.md): Python 3.10+, dependencies installed, virtual environment active. You'll see `(.venv)` at the start of your terminal prompt if it's active.

If you haven't installed dependencies yet:

```bash
python3 -m venv .venv
source .venv/bin/activate       # Mac/Linux
# .venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

---

## One command

From the repo root:

```bash
python3 training/train.py
```

This will take **15–30 minutes** on a laptop CPU. You'll see output as it runs. You don't need to watch it — go make coffee. Come back when it says `=== Done ===`.

---

## What's happening while you wait

The script runs four steps. Here's what each one actually means.

---

### Step 1: Loading the base model

```
=== Step 1: Loading base model (distilbert-base-uncased) ===
```

The script downloads a model called DistilBERT from HuggingFace. This is the starting point — a model that already understands English because someone else trained it on a huge amount of text (books, Wikipedia, web pages). It took them weeks and significant compute. You're not doing that.

What it doesn't know is your categories. It has no idea what `bug_report` or `onboarding_friction` mean. That's what you're about to teach it.

Think of it like hiring someone who is fluent in English but has never worked in product. They can read your tickets. They just don't know yet which pile each one goes in.

---

### Step 2: Loading and splitting the data

```
=== Step 2: Loading data from training/data/feedback.csv ===
Training on 130 examples, testing on 33 examples.
```

The script loads your 163 labeled examples and splits them into two groups:

**Training set (80%)** — the examples the model studies. It reads these over and over during training.

**Test set (20%)** — examples the model never sees during training. These are used at the end to measure how well it learned. If you tested the model on the same examples it studied, you'd be measuring memorization, not learning.

This 80/20 split is automatic and random. It's a reasonable starting point, but it's also a temporary measurement tool — in Chapter 05 you'll build a fixed eval set that gives you a more reliable number. For now, the test set tells you roughly where you stand.

**The limitation you should know:** With 163 examples, holding back 20% gives you a test set of 33 rows. That's not enough to detect a systematic weakness in a single label — if the model gets all 6 `onboarding_friction` test examples right by luck, it looks fine on that category even if it would fail on 30% of real inbox tickets. The 80/20 split is a sanity check, not a verdict. Don't make product decisions based on it.

---

### Step 3: Tokenizing and fine-tuning

```
=== Step 3: Tokenizing and fine-tuning ===
This is the part that takes time. Go make a coffee.
```

**Tokenizing** means breaking text into pieces the model can process. The model doesn't read words — it reads tokens. A token is roughly a word fragment. "onboarding" might become `["on", "##board", "##ing"]`. "pricing" becomes `["pricing"]`. The model operates on these fragments, not on whole words.

Why does this matter? It means the model can handle words it's never seen before by breaking them into familiar parts. "unstackable" might be new, but "un-", "stack", and "-able" aren't.

**Fine-tuning** is the actual training. The model reads each example in the training set, predicts a label, compares its prediction to the correct label, and adjusts its internal numbers slightly in the direction of the right answer. It does this for all 130 training examples. Then it does it again. Then again. Three full passes — that's what `num_train_epochs=3` means in the script.

After each pass, it checks its accuracy on the test set. You'll see these numbers scroll by:

```
{'eval_loss': 1.23, 'eval_accuracy': 0.67, ...}   # after pass 1
{'eval_loss': 0.91, 'eval_accuracy': 0.79, ...}   # after pass 2
{'eval_loss': 0.74, 'eval_accuracy': 0.85, ...}   # after pass 3
```

Loss going down and accuracy going up means the model is learning. If both numbers plateau early or accuracy stays low, your data quality or label definitions may need attention — that's a signal to look at, not a failure.

**The iteration velocity tradeoff:** Each training run takes 15–30 minutes on a laptop CPU. That means roughly 6–8 experiments per day if you're actively tuning. If you need faster iteration — to test more data combinations or label changes — you have two options: rent a GPU (faster training, real cost) or use a smaller base model (faster but potentially lower accuracy ceiling). For this tutorial, the laptop CPU is fine. For a production workflow where you retrain weekly, iteration speed becomes a real product constraint worth planning around.

---

### Step 4: Evaluating and saving

```
=== Step 4: Evaluating the model ===
```

After training, the script runs the model against the test set and prints three things:

**Per-category results** — precision, recall, and F1 for each label. These tell you not just whether the model is right on average, but which specific categories it handles well and which it struggles with.

- **Precision**: when the model says "this is a bug report," how often is it actually a bug report?
- **Recall**: of all the actual bug reports in the test set, how many did the model catch?
- **F1**: the balance between the two — this is the number to watch per category.

**Confusion matrix** — a grid showing where the model gets confused. If `onboarding_friction` keeps getting predicted as `bug_report`, that shows up here. This is the pattern you'll use in later chapters to improve the model deliberately.

**Mistakes** — the specific tickets the model got wrong. Read these. They're not random noise — they usually reveal a pattern. Maybe all the mistakes are short Slack-style messages. Maybe a specific type of pricing complaint is getting misclassified as `feature_request`. These are your tuning targets.

The model is then saved to `training/model/`. That folder is gitignored — it's too large to commit, and you can always regenerate it by running this script again.

---

## What the numbers mean — and what they don't

You'll see an overall accuracy somewhere between 70% and 90% on your first run. That range is normal for a first baseline with ~160 training examples.

Here's the important thing: **this number is not a verdict.**

An 85% accuracy on 33 test examples means the model got 28 right and 5 wrong. That's not enough data to know whether those 5 mistakes are a fluke or a systematic problem. It doesn't tell you which categories are weak. It doesn't tell you whether the model would hold up on the real Monday-morning inbox — 340 tickets it's never seen, including weird phrasings, sarcasm, and messages that straddle two categories.

The baseline gives you a starting point, not a finish line. That's its only job.

**How to present this to a stakeholder:** When someone asks "is the model ready to use?", the baseline number alone isn't the answer. The honest answer is: "It's classifying about 80% of test examples correctly, but that test set is only 33 examples randomly pulled from our training pool. I need to run it against a proper held-out eval before I can tell you whether it's ready — and even then, the right question is which categories it gets wrong and whether those failures are acceptable for our use case." Chapter 05 gives you what you need to answer that properly.

In Chapter 04, you'll see exactly why a high accuracy score can still mean a model you shouldn't trust. In Chapter 05, you'll build the eval that actually tells you whether it's ready.

---

## What got saved

After `=== Done ===`, your repo will have a new folder:

```
training/model/
  config.json           # model architecture and label mappings
  model.safetensors     # the trained weights — this is the actual model
  tokenizer.json        # how to tokenize new text the same way as training
  tokenizer_config.json
  vocab.txt
```

This is the artifact you built. It's the function that, given a piece of feedback text, returns one of your five labels. In Chapter 07, you'll load this artifact into a TypeScript server and call it like any other API endpoint.

The `training/model/` folder is gitignored because the files are large and can be regenerated. Never commit model artifacts.

---

## If something goes wrong

**`ModuleNotFoundError: No module named 'accelerate'`**
Run `pip install -r requirements.txt`. The virtual environment may not have been active when you installed dependencies.

**`FileNotFoundError: training/data/feedback.csv`**
Run the script from the repo root, not from inside the `training/` folder.

**Training stops early or throws a CUDA error**
Reduce `per_device_train_batch_size` from 16 to 8 in `train.py` line 149. This uses less memory.

**The model saves but accuracy looks very low (below 40%)**
Check that your virtual environment is active and you're using Python 3.10+. Also check `training/data/feedback.csv` has the right column names: `text` and `label`.

---

## The story so far

You started Monday morning with 340 tickets and no way to answer five questions in under an hour. You've now labeled 163 examples, taught a model to recognize the patterns in them, and produced a first draft classifier.

It's rough. You know that. The number it just printed is a starting point, not a result.

Next: [Chapter 04 — Why a high accuracy score can still mean a bad model](04-why-accuracy-lies.md)
