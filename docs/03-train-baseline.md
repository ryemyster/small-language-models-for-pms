# Chapter 03 — Train a First Rough Model

## Before you start

**Your working folder for this chapter:** `chapters/03-train-baseline/`

Open your terminal and navigate there:

```bash
cd chapters/03-train-baseline
```

**✓ Confirm you're in the right place:**

```bash
ls
```

You should see:

```
README.md   data/   requirements.txt   train.py
```

And inside `data/`:

```bash
ls data/
```

```
feedback.csv
```

That's the completed training data from Chapter 02 — 163 labeled examples, ready to go. You don't need to copy anything.

**What you'll do in this chapter:**
- Turn on the project's Python environment
- Run training and watch it work
- Read the output and understand what each number means

**What you'll have when you're done:**
- A trained model saved to `chapters/03-train-baseline/model/`
- Your first accuracy score (a rough starting point, not a verdict)

---

You have 163 labeled examples. The model has never seen them. That's about to change.

This chapter runs the training script and explains every step — what the computer is doing, why it's doing it, and what the numbers mean when it's done. By the end, your laptop will have a working model that can sort feedback into the five categories.

It won't be perfect. That's expected. This is the first draft.

---

## Step 1: Turn on the project's Python environment

When you ran setup in [Getting Started](getting_started.md), it created a virtual environment called `.venv` in the project root, with every Python package this tutorial needs. Every chapter uses that same one, so you only install once.

Make sure you're inside `chapters/03-train-baseline/` first. Then run:

```bash
source ../../.venv/bin/activate       # Mac or Linux
```

```bash
..\..\.venv\Scripts\activate          # Windows (PowerShell)
```

**✓ If it worked**, your terminal prompt changes. You'll see `(.venv)` at the very start:

```
(.venv) your-name@your-computer 03-train-baseline %
```

**✗ If you see `No such file or directory`** (or `is not recognized` on Windows), setup hasn't been run yet. Go back to the project root, run it, then come back:

```bash
cd ../..
python3 setup.py
cd chapters/03-train-baseline
```

> [!TIP]
> You'll do this at the start of every chapter. The environment only stays on for the terminal window you turned it on in. Open a new window, turn it on again.

---

## Step 2: Open the training script

**Open `chapters/03-train-baseline/train.py` in your text editor.**

Scroll through it. You don't need to understand all of it. Just find a few things (use your editor's search, `Cmd+F` on Mac or `Ctrl+F` on Windows):

- Near the top: a check that `accelerate` is installed before doing anything else
- Search for `BASE_MODEL` — `"distilbert-base-uncased"` is the base model it starts with
- Search for `num_train_epochs` — how many times the model studies your examples, start to finish

You'll come back to this file in Chapter 06 when you tune the model deliberately. For now, just know it exists and where to find it.

---

## Step 3: Run training

From inside `chapters/03-train-baseline/`, run:

```bash
python3 train.py
```

**This takes about a minute on a recent laptop, and longer on an older one.** The first run also downloads the base model (about 250MB), so give it a few extra minutes. Come back when you see `=== Done ===` in the terminal.

**✓ If it starts printing output right away**, it's working. You should see something like:

```
=== Step 1: Loading base model (distilbert-base-uncased) ===
```

**✗ If you see `ModuleNotFoundError: No module named 'accelerate'`**

The project's environment isn't turned on. Go back to Step 1, then try again.

**✗ If you see `FileNotFoundError` mentioning `data/feedback.csv`**

The training data is missing from this folder. Run `ls data/` — you should see `feedback.csv`. If it's gone, restore it with `git checkout -- data/feedback.csv`.

---

## What's happening while you wait

The script runs four steps. Here's what each one actually means.

---

### Step 1: Loading the base model

```
=== Step 1: Loading base model (distilbert-base-uncased) ===
```

The script downloads a model called DistilBERT. DistilBERT is a model that already understands English — someone else trained it on books, Wikipedia, and web pages. That took them weeks and significant compute. You're not doing that part.

What DistilBERT doesn't know is your categories. It has no idea what `bug_report` or `onboarding_friction` mean. That's what you're about to teach it.

Think of it like hiring someone who is fluent in English but has never worked in product. They can read your tickets. They just don't know yet which pile each one goes in.

---

### Step 2: Loading and splitting the data

```
=== Step 2: Loading data from data/feedback.csv ===
Training on 130 examples, testing on 33 examples.
```

The script loads your 163 labeled examples and splits them into two groups:

**Training set (80%):** The examples the model studies. It reads these over and over during training.

**Test set (20%):** Examples the model never sees during training. These are used at the end to check how well it learned. If you tested the model on the same examples it studied, you'd be measuring memorization, not learning.

> [!WARNING]
> With 163 examples, holding back 20% gives you a test set of 33 rows. That's not enough to detect a systematic weakness in a single label. In Chapter 05, you'll build a proper eval set that gives you a number you can actually trust. For now, the test set is just a rough sanity check.

> [!IMPORTANT]
> **Customer impact:** At 340 tickets per Monday, an 80% accuracy rate means roughly 68 tickets get the wrong label every week. A `pricing_concern` labeled as `praise` never reaches the PM who could flag it to the pricing team. A `bug_report` filed as `feature_request` sits in the wrong queue while real users are hitting a broken product. Accuracy isn't an abstract number — it directly measures how reliably your customers' problems reach the people who can fix them.

---

### Step 3: Tokenizing and fine-tuning

```
=== Step 3: Tokenizing and fine-tuning ===
This is the part that takes time. Go make a coffee.
```

**Tokenizing** means breaking text into pieces the model can process. The model doesn't read words — it reads tokens. A token is roughly a word fragment. "onboarding" might become `["on", "##board", "##ing"]`. This matters because it means the model can handle words it's never seen before by breaking them into familiar parts.

**Fine-tuning** is the actual training. The model reads each example in the training set, predicts a label, compares its prediction to the correct label, and adjusts its internal numbers slightly in the direction of the right answer. It does this for all 130 training examples — then does it again, and again. Six full passes total.

After each pass, it checks itself against the test set. Among the progress bars, you'll see a line like this after every pass (shortened here):

```
{'eval_loss': '1.494', ..., 'epoch': '1'}
{'eval_loss': '1.298', ..., 'epoch': '2'}
{'eval_loss': '1.087', ..., 'epoch': '3'}
{'eval_loss': '0.9352', ..., 'epoch': '4'}
{'eval_loss': '0.8286', ..., 'epoch': '5'}
{'eval_loss': '0.8065', ..., 'epoch': '6'}
```

**Loss** is a measure of how wrong the model's guesses are on the test set. Lower is better. **Loss going down pass after pass means the model is learning.** If it stops dropping after the first pass or two, or barely moves at all, your data quality or label definitions may need attention. That's a signal to look at — not a failure.

> [!TIP]
> **Tradeoff:** With 163 examples, a training run takes about a minute. Training time grows with the size of your data, so a real dataset of a few thousand examples takes much longer per run, and every experiment costs that wait. If you need faster iteration — to test more data combinations or label changes — you have two options: rent a GPU (faster training, real cost) or use a smaller base model (faster but potentially lower accuracy). For this tutorial, your laptop is fine. For a production workflow where you retrain weekly, iteration speed becomes a real constraint worth planning around.

---

### Step 4: Evaluating and saving

```
=== Step 4: Evaluating the model ===
```

After training, the script runs the model against the test set and prints three things:

**Per-category results** — a score for each label. You'll learn exactly how to read these in Chapter 05. For now, notice which labels have higher scores and which have lower ones.

**Confusion matrix** — a grid showing where the model gets confused. If `onboarding_friction` keeps getting predicted as `bug_report`, that shows up here as a number off the diagonal. You'll use this in Chapter 06 to improve the model.

**Mistakes** — the specific tickets the model got wrong. Read these. They usually reveal a pattern — maybe all the mistakes are short Slack-style messages, maybe a specific type of pricing complaint is getting misclassified. These are your tuning targets later.

---

## When training finishes

When you see `=== Done ===`, look at your project folder.

**Open your file explorer (Finder on Mac, File Explorer on Windows) and navigate to the `chapters/03-train-baseline/` folder.**

You should now see a new folder called `model/`. Inside it:

```
model/
  config.json           ← model settings and label names
  model.safetensors     ← the actual trained model (this is the big one)
  tokenizer.json        ← how to break text into tokens
  tokenizer_config.json
  training_args.bin     ← the settings training used
```

**✓ If you see `model.safetensors`, training worked.** That file is the function you built. Given a piece of feedback text, it returns one of your five labels.

**✗ If the `model/` folder doesn't exist**, scroll back up in the terminal and look for an error message. The most common ones are covered in the troubleshooting section below.

> [!NOTE]
> The `model/` folder is intentionally excluded from git. It's too large to commit (about 250MB) and you can always regenerate it by running `train.py` again. Never try to commit the model files — the `.gitignore` will block it anyway.

---

## What the numbers mean — and what they don't

Find the `accuracy` line in the per-category results. When we ran it, the baseline came out at **0.88**: 88% of the 33 test examples. Your number may differ by a few points, depending on your computer. Anywhere from the mid-80s to low 90s is normal for a first baseline with ~160 training examples.

**This number is not a verdict.** Here's why:

88% on 33 test examples means the model got 29 right and 4 wrong. That's not enough data to know whether those 4 mistakes are a fluke or a systematic problem. It doesn't tell you which categories are weak. It doesn't tell you whether the model would hold up on the real Monday-morning inbox — 340 tickets it's never seen, including weird phrasings, sarcasm, and messages that straddle two categories.

The baseline gives you a starting point, not a finish line. In Chapter 04, you'll see exactly why a high accuracy score can still mean a model you shouldn't trust. In Chapter 05, you'll build the eval that actually tells you whether it's ready.

---

## If something goes wrong

**`ModuleNotFoundError: No module named 'accelerate'`** (or `torch`, or `transformers`)
The project's environment isn't turned on in this terminal window. Run `source ../../.venv/bin/activate` (Windows: `..\..\.venv\Scripts\activate`) and try again.

**`FileNotFoundError` mentioning `data/feedback.csv`**
The training data is missing. Restore it with `git checkout -- data/feedback.csv`.

**Training stops early or throws a CUDA error**
Search `train.py` for `per_device_train_batch_size=16`. Change `16` to `8`. Save the file and run `train.py` again. This uses less memory.

**The model saves but accuracy looks very low (below 40%)**
Check that your virtual environment is active and you're using Python 3.11+. Also check `data/feedback.csv` has column names `text` and `label` in the first row.

---

## The story so far

You started Monday morning with 340 tickets and no way to answer five questions in under an hour.

You've now labeled 163 examples and trained a first draft classifier. It's rough — you know that. The number it just printed is a starting point, not a result.

Next you'll find out exactly how rough it is, and why the way you measure matters as much as the model itself.

---

**Next:** [Chapter 04 — Why a high accuracy score can still mean a bad model](04-why-accuracy-lies.md)
