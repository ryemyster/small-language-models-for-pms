# Getting Started

You do not need to be a developer to follow this tutorial. This guide will walk you through everything — what to install, how to run the code, and what to look for to know it's working.

Set aside about 30 minutes for the initial setup. Training the model takes another 20 minutes, but you can walk away while it runs.

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

The script checks your versions, creates a virtual environment, installs all Python and Node packages, and tells you exactly what's wrong if something fails. If it ends with "Setup complete" you're ready to train.

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

Go to [python.org/downloads](https://www.python.org/downloads/) and download Python 3.10 or higher. Run the installer. On Windows, check the box that says "Add Python to PATH" before clicking Install.

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
README.md   docs/   package.json   requirements.txt   src/   training/
```

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

This downloads the local language model we'll compare against. It's about 4GB — it will take a few minutes depending on your connection.

```
ollama pull llama3
```

You should see a progress bar, then:

```
success
```

---

## You're ready

Run these commands to confirm everything is in place:

```bash
python3 --version        # should show Python 3.10 or higher
node --version           # should show v20 or higher
ollama list              # should respond without error
python3 -c "import transformers, datasets, sklearn, pandas, accelerate, torch; print('Python deps OK')"
```

If the last command prints `Python deps OK`, all training dependencies are installed.

Once everything passes, go back to the [README](../README.md) and follow the run steps from the top.

---

## Something went wrong?

Common issues:

**"command not found" for python3** — Python isn't installed or isn't on your PATH. Reinstall from python.org, and on Windows make sure "Add Python to PATH" is checked.

**"permission denied" on pip install** — Make sure your virtual environment is active. You should see `(.venv)` at the start of your terminal prompt before running `pip install`. If it's not there, run `source .venv/bin/activate` (Mac/Linux) or `.venv\Scripts\activate` (Windows). Never use `sudo pip install` — it installs packages globally and can break other things on your machine.

**pip install fails with a long error** — Copy the last line of the error and search it. These are usually specific package conflicts. The most common fix is `pip install --upgrade pip` then try again.

**npm install fails** — Make sure Node 20+ is installed (`node --version`). If the version is right, delete the `node_modules/` folder and try again.

**Ollama won't start** — Make sure you opened the Ollama app at least once. It runs as a background process. On Mac, you should see the llama icon in your menu bar.
