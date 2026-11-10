# Getting Started

You do not need to be a developer to follow this tutorial. This guide will walk you through everything — what to install, how to run the code, and what to look for to know it's working.

> [!TIP]
> **Rather have a coding agent do this for you?** Open the folder in Claude Code, Cursor, GitHub Copilot, or Codex and type **hi**. It checks your computer, installs what's missing (after asking), and walks you through the chapters. See [START_HERE.md](../START_HERE.md).

Set aside about 30 minutes for the initial setup. Training the model itself is quick: about a minute on a recent laptop, longer on an older one.

---

## How this tutorial is organized

Before you install anything, read this — it will save you a lot of confusion.

### The repo has two parts

**`docs/`** — The chapter guides. This is where you read the explanations and follow the steps. Start each chapter by opening the matching doc.

**`chapters/`** — A folder of working directories, one per chapter. This is where you run commands and edit files.

They go together. For Chapter 02, you read `docs/02-labels-and-training-data.md` and do the hands-on work inside `chapters/02-labels-and-data/`.

---

### How each chapter folder works

Each `chapters/` folder is self-contained. It already has all the files from the previous chapter's solution, so you can start fresh at any chapter without having completed everything before it.

**Example: starting Chapter 03**

```
chapters/03-train-baseline/
  data/
    feedback.csv        ← 163 labeled examples (Chapter 02's completed work)
  train.py              ← the training script
  requirements.txt      ← Python dependencies
```

You don't need to copy files from Chapter 02. They're already there.

**What's NOT included:** The trained model (`model/` folder). It's too large to store in git. You train it once in Chapter 03 and copy it forward from chapter to chapter. Each chapter's "Before you start" section tells you exactly what to copy, or when to train.

---

### The root project vs. the chapter folders

The **root project** (the main project folder) is the final reference — it has the complete, finished version of everything. If you're curious about what the end state looks like, explore it there.

The **chapter folders** are where you do your work while learning. Each chapter doc tells you exactly which folder to be in and which files to open.

If you ever get confused about where you are, look at your terminal prompt. It should end with the chapter folder name, like:

```
.../small-language-models-for-pms/chapters/03-train-baseline %
```

---

### Your numbers won't match ours exactly — and that's expected

Every score in these chapters is real output: we ran each step and pasted what we got. When you run them, your numbers will usually land within a few points of ours, not exactly on them. Three reasons:

- **Training starts from random numbers.** Before training, the part of the model that picks a label starts out filled with random values. `train.py` fixes the random starting point (that's the `set_seed(42)` line), so training twice on the same computer gives you the same model. That's what makes before-and-after comparisons fair.
- **Different chips do the math slightly differently.** A Mac's graphics chip, an NVIDIA graphics card, and a plain processor round numbers in slightly different ways. Over hundreds of training steps, tiny differences add up to a slightly different model. On the same Mac, we got 85% on the fixed eval using its graphics chip and 83% using the processor alone.
- **Software versions change results.** `requirements.txt` pins exact versions so everyone starts from the same software. Install different versions and expect different numbers.

**What should match is the pattern:** which label is weakest, where the model gets confused, and whether a change helped. If your scores are far below ours — more than about 10 points — something probably went wrong. Check the troubleshooting section in Chapter 03.

This is a real-world lesson too. Model results are only comparable when they come from the same setup. When you compare two training runs, use the same computer, the same eval, and change one thing. That's exactly what the experiment log in Chapter 06 is for.

---

## The fast path: one setup script

Once you've installed Python, Node.js, and Ollama (steps 1–3 below), run this from the project folder and it will handle the rest:

**Mac / Linux:**

```bash
python3 setup.py
```

**Windows (PowerShell):**

```
python setup.py
```

The script checks your versions, creates a virtual environment (a folder called `.venv` holding this project's Python packages), installs all Python and Node packages, and tells you exactly what's wrong if something fails. If it ends with "Setup complete", skip ahead to [You're ready](#youre-ready).

If you prefer to do it manually, continue with the steps below.

---

## What is a terminal?

A terminal is a text-based way to talk to your computer. Instead of clicking on icons, you type commands and your computer responds. It sounds old-fashioned, but it's faster for this kind of work.

**On a Mac:** Press `Command + Space`, type "Terminal", and press Enter.

**On Windows:** Press `Windows key`, type "PowerShell", and press Enter.

You'll see a window with a blinking cursor. That's where you type commands. When this guide shows a command in a code block like this:

```
python3 --version
```

...type it exactly as shown and press Enter.

---

## Step 1: Install Python

Python is the programming language we use to train the model.

Go to [python.org/downloads](https://www.python.org/downloads/) and download Python 3.11 or higher. Run the installer. On Windows, check the box that says "Add Python to PATH" before clicking Install.

> [!NOTE]
> **Using an older Intel Mac?** The training library this tutorial uses (PyTorch) no longer publishes installers for Intel Macs. You'll need an Apple Silicon Mac (M1 or newer), Windows, or Linux.

**To confirm it worked**, open your terminal and run:

```
python3 --version
```

You should see something like:

```
Python 3.11.4
```

If you see `command not found`, the installation didn't finish correctly. Try restarting your terminal first, then re-running the command.

---

## Step 2: Install Node.js

Node.js lets you run the TypeScript classifier — the part that calls the model from code.

Go to [nodejs.org](https://nodejs.org) and download the **LTS** version (the one labeled "Recommended For Most Users"). Run the installer.

**To confirm it worked:**

```
node --version
```

You should see something like:

```
v20.11.0
```

The number needs to be 20 or higher. If it's lower, download the latest LTS version from nodejs.org again.

---

## Step 3: Install Ollama

Ollama is a tool that lets you run large language models locally — on your laptop, without sending data to anyone. We use it to compare against our fine-tuned model later.

Go to [ollama.com](https://ollama.com) and download the app for your operating system. Install it and open it once to make sure it starts.

**To confirm it worked:**

```
ollama list
```

You should see something like:

```
NAME    ID    SIZE    MODIFIED
```

It might be empty at first — that's fine. We'll pull the model we need in a later step.

---

## Step 4: Get this repository

A repository is a folder of code, hosted on GitHub. You need to copy it to your computer.

If you have git installed:

```
git clone https://github.com/ryemyster/small-language-models-for-pms.git
cd small-language-models-for-pms
```

If you don't have git, click the green "Code" button on the GitHub page, choose "Download ZIP", unzip it, and open your terminal in that folder.

**To confirm you're in the right place:**

```
ls
```

You should see something like:

```
CODE_OF_CONDUCT.md   CONTRIBUTING.md   LICENSE   README.md   chapters   docs
package-lock.json    package.json      requirements.txt   setup.py   src   supabase   training
```

The exact layout depends on your terminal's width. What matters is that you see `chapters`, `docs`, and `setup.py`.

---

## Step 5: Install Python dependencies

Dependencies are extra packages that the code needs to run. This command reads the list from `requirements.txt` and installs everything at once.

First, create a virtual environment (an isolated space for this project's packages, so they don't conflict with anything else on your computer):

```
python3 -m venv .venv
```

Then activate it:

**Mac/Linux:**

```
source .venv/bin/activate
```

**Windows:**

```
.venv\Scripts\activate
```

You should see `(.venv)` appear at the start of your terminal prompt. That means it's active.

Now install the packages:

```
pip install -r requirements.txt
```

This will take a few minutes. You should see a stream of lines ending with "Successfully installed ...".

If you see an error mentioning `torch`, try running this first and then re-running the install:

```
pip install --upgrade pip
```

---

## Step 6: Install Node dependencies

This installs the TypeScript packages the classifier needs.

```
npm install
```

You should see something like:

```
added 47 packages in 3s
```

---

## Step 7: Pull the Ollama comparison model

This downloads the general-purpose language model your model goes up against in Chapter 07. It's small for a general model — about 1GB to download, and it needs about 1GB of memory while it runs — so it fits on most laptops.

```
ollama pull qwen2.5:1.5b
```

You should see a progress bar, then:

```
success
```

---

## You're ready

First, turn on the project's environment, if it isn't already. You'll do this every time you open a new terminal window:

```bash
source .venv/bin/activate        # Mac/Linux
```

```
.venv\Scripts\activate           # Windows
```

You should see `(.venv)` at the start of your prompt. Then run these to confirm everything is in place:

```bash
python3 --version        # should show Python 3.11 or higher
node --version           # should show v20 or higher
ollama list              # should respond without error (lists qwen2.5:1.5b once you've pulled it)
python3 -c "import transformers, datasets, sklearn, pandas, accelerate, torch; print('Python deps OK')"
```

If the last command prints `Python deps OK`, all training dependencies are installed.

Used the setup script? It doesn't download the comparison model. Run `ollama pull qwen2.5:1.5b` now ([Step 7](#step-7-pull-the-ollama-comparison-model)) or when you reach Chapter 07.

**You're set.** Start with [Chapter 01 — When SLMs make sense](when-slms-make-sense.md), then [Chapter 02](02-labels-and-training-data.md). Each chapter tells you which folder to work in.

---

## Something went wrong?

Common issues:

**"command not found" for python3** — Python isn't installed or isn't on your PATH. Reinstall from python.org, and on Windows make sure "Add Python to PATH" is checked.

**"permission denied" on pip install** — Make sure your virtual environment is active. You should see `(.venv)` at the start of your terminal prompt before running `pip install`. If it's not there, run `source .venv/bin/activate` (Mac/Linux) or `.venv\Scripts\activate` (Windows). Never use `sudo pip install` — it installs packages globally and can break other things on your machine.

**pip says it can't find a version of `torch` (or another package)** — Your Python version is probably outside what the packages support. Run `python3 --version`: it needs to be 3.11 or newer. If it's very new (newer than 3.15), install Python 3.15 from python.org, delete the `.venv` folder, and run setup again.

**`ModuleNotFoundError: No module named 'torch'`** (or `transformers`) when you run a script — The project's environment isn't turned on in this terminal window. Run `source .venv/bin/activate` (Windows: `.venv\Scripts\activate`) from the project root, or `source ../../.venv/bin/activate` from inside a chapter folder.

**pip install fails with a long error** — Copy the last line of the error and search it. These are usually specific package conflicts. The most common fix is `pip install --upgrade pip` then try again.

**npm install fails** — Make sure Node 20+ is installed (`node --version`). If the version is right, delete the `node_modules/` folder and try again.

**Ollama won't start** — Make sure you opened the Ollama app at least once. It runs as a background process. On Mac, you should see the llama icon in your menu bar.
