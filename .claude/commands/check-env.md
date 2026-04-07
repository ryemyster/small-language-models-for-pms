# check-env

Verify that all prerequisites are in place before running training or the classifier.
Prints a clear pass/fail for each check.

## Steps

Run these checks in order and report each result:

### 1. Python version
```bash
python3 --version
```
Pass: `Python 3.10.x` or higher
Fail: version is below 3.10, or command not found → tell the user to install Python 3.10+ from python.org

### 2. Virtual environment
Check if `.venv/` exists in the repo root and is activated (look for `(venv)` or `(.venv)` in the shell prompt, or run `which python` and check the path contains `.venv`).

Pass: venv is active and points to the repo's `.venv/`
Fail: not active → `source .venv/bin/activate`
Fail: doesn't exist → `python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`

### 3. Python dependencies
```bash
pip show transformers datasets scikit-learn pandas torch
```
Pass: all five packages are listed
Fail: any missing → `pip install -r requirements.txt`

### 4. Node version
```bash
node --version
```
Pass: `v20.x.x` or higher
Fail: below v20 or not found → tell the user to install Node 20+ from nodejs.org

### 5. Node dependencies
Check that `node_modules/` exists in the repo root.
Pass: directory exists
Fail: run `npm install`

### 6. Ollama
```bash
ollama list
```
Pass: command runs and shows at least one model (ideally `llama3`)
Fail: `command not found` → tell user to install Ollama from ollama.com
Fail: connection refused → Ollama is installed but not running → `ollama serve` in a separate terminal
Fail: llama3 not in list → `ollama pull llama3`

### 7. Trained model artifact
Check that `training/model/` exists and is non-empty.
Pass: directory exists with model files inside
Fail: not yet trained → user needs to run `python training/train.py` first

## Output format

Print each check as a single line:
```
[PASS] Python 3.11.4
[PASS] Virtual environment active
[PASS] Python dependencies installed
[PASS] Node v20.11.0
[PASS] Node dependencies installed
[PASS] Ollama running, llama3 available
[FAIL] Model not trained yet — run: python training/train.py
```
