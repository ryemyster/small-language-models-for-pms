# run-python

Run a Python file using the project's virtual environment and report the result clearly.

## Usage

```
/run-python <file-path> [args]
```

Example: `/run-python training/train.py`

## Steps

1. Check that a virtual environment is active — look for `.venv/` or `venv/` in the repo root
   - If not active, activate it: `source .venv/bin/activate` (Mac/Linux)
   - If it doesn't exist: `python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
2. Run the file: `python <file-path> [args]`
3. Capture stdout and stderr
4. If it succeeds: print the output and confirm what it produced (files created, model saved, etc.)
5. If it fails: print the error, identify the likely cause in plain English, and suggest the fix

## Error diagnosis rules

- `ModuleNotFoundError`: the venv is missing a package — run `pip install -r requirements.txt`
- `FileNotFoundError`: a data file path is wrong — check that `training/data/feedback.csv` exists
- `CUDA / MPS not available`: fine — the model trains on CPU, this warning is harmless
- `killed` or memory error: the model is too large for available RAM — this shouldn't happen with distilbert on a normal laptop, but flag it to the user
