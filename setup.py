"""
setup.py — One-time setup for Small Language Models for PMs.

Run this first. It checks what you need, installs what's missing,
and tells you exactly what to do if something goes wrong.

Works on Mac, Windows, and Linux.

Run with:
  python3 setup.py     (Mac / Linux)
  python setup.py      (Windows)

Just checking? `python3 setup.py --check` reports what's ready and how far
through the chapters you are. It changes nothing.
"""

import subprocess
import sys
import os
import shutil
import platform

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def run(cmd, capture=True, timeout=300):
    """Run a shell command. Return (success, output).

    With capture=False the command prints straight to the terminal, so output is "".
    Pass timeout=None for installs: they can take longer than 5 minutes on a slow connection.
    """
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=capture,
            text=True, timeout=timeout
        )
        output = ((result.stdout or "") + (result.stderr or "")).strip()
        return result.returncode == 0, output
    except subprocess.TimeoutExpired:
        return False, "timed out"
    except Exception as e:
        return False, str(e)

def header(text):
    print(f"\n{'─' * 50}")
    print(f"  {text}")
    print('─' * 50)

def ok(msg):
    print(f"  ✓  {msg}")

def fail(msg):
    print(f"  ✗  {msg}")

def info(msg):
    print(f"     {msg}")

IS_WINDOWS = platform.system() == "Windows"
VENV_DIR = ".venv"
VENV_PYTHON = os.path.join(VENV_DIR, "Scripts" if IS_WINDOWS else "bin", "python")
VENV_PIP    = os.path.join(VENV_DIR, "Scripts" if IS_WINDOWS else "bin", "pip")

# The pinned packages in requirements.txt publish installers for Python 3.11–3.15.
NEWEST_TESTED = 15
COMPARE_MODEL = "qwen2.5:1.5b"   # the general model Chapter 07 compares against

# Always work from the project root, wherever this script was started from
os.chdir(os.path.dirname(os.path.abspath(__file__)))


# ─────────────────────────────────────────────
# --check: read-only status report (changes nothing)
# ─────────────────────────────────────────────

CHAPTERS = [
    ("03-train-baseline", "Train a baseline"),
    ("04-why-accuracy-lies", "Why accuracy lies"),
    ("05-fixed-eval", "Fixed eval"),
    ("06-tuning-loop", "Tuning loop"),
    ("07-serve-the-model", "Serve the model"),
    ("08-embeddings-storage", "Embeddings (optional)"),
]

def log_row(path, run_name):
    """Look up one row of an experiment log. Returns "yours", "guide's numbers", or None if empty."""
    if not os.path.exists(path):
        return None
    with open(path, encoding="utf-8") as f:
        for line in f:
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) >= 4 and cells[0] == run_name:
                if not cells[3]:
                    return None
                return "guide's numbers" if cells[1] == "guide" else "yours"
    return None

def check():
    """Report what's installed and how far along the chapters are. Returns True if ready to train."""
    ready = True

    header("Your tools")
    v = sys.version_info
    if v.major == 3 and 11 <= v.minor <= NEWEST_TESTED:
        ok(f"Python {v.major}.{v.minor}.{v.micro}")
    elif v.major == 3 and v.minor > NEWEST_TESTED:
        ok(f"Python {v.major}.{v.minor}.{v.micro} (newer than tested — 3.{NEWEST_TESTED} is the safe choice)")
    else:
        fail(f"Python {v.major}.{v.minor} — need 3.11 or newer")
        ready = False

    ok_node, node_out = run("node --version")
    if ok_node and node_out.startswith("v") and node_out.lstrip("v").split(".")[0].isdigit() \
            and int(node_out.lstrip("v").split(".")[0]) >= 20:
        ok(f"Node.js {node_out}")
    else:
        fail("Node.js 20 or newer not found (needed from Chapter 07)")

    ok_ollama, ollama_out = run("ollama list")
    if ok_ollama and COMPARE_MODEL in ollama_out:
        ok(f"Ollama running, {COMPARE_MODEL} downloaded")
    elif ok_ollama:
        info(f"·  Ollama running; {COMPARE_MODEL} not downloaded yet (needed in Chapter 07): ollama pull {COMPARE_MODEL}")
    else:
        info("·  Ollama not found or not running (needed from Chapter 07)")

    header("Project setup")
    if os.path.exists(VENV_PYTHON):
        # find_spec checks each package is installed without slowly importing it
        probe = ("import importlib.util as u, sys; "
                 "m = [x for x in ('torch', 'transformers', 'datasets', 'sklearn', 'pandas', 'accelerate') "
                 "if u.find_spec(x) is None]; print(' '.join(m)); sys.exit(1 if m else 0)")
        result = subprocess.run([VENV_PYTHON, "-c", probe], capture_output=True, text=True)
        if result.returncode == 0:
            ok("Python packages installed (.venv)")
        else:
            fail(f"Python packages missing: {result.stdout.strip() or 'check .venv'} — run: python3 setup.py")
            ready = False
    else:
        fail("Python packages not installed yet — run: python3 setup.py")
        ready = False
    if os.path.isdir("node_modules"):
        ok("Node packages installed")
    else:
        info("·  Node packages not installed yet — python3 setup.py does this")

    header("Your progress")
    for folder, name in CHAPTERS:
        path = os.path.join("chapters", folder)
        status = ["✓ model" if os.path.exists(os.path.join(path, "model", "model.safetensors")) else "· no model yet"]
        if folder == "05-fixed-eval":
            row = log_row(os.path.join(path, "experiment-log.md"), "0 (baseline)")
            status.append("✓ baseline logged" if row else "· baseline not logged")
        if folder == "06-tuning-loop":
            log = os.path.join(path, "experiment-log.md")
            row0, row1 = log_row(log, "0 (baseline)"), log_row(log, "1")
            status.append(f"Run 0: {row0}" if row0 else "· Run 0 empty")
            status.append("✓ Run 1 logged" if row1 else "· Run 1 not logged")
        print(f"  {folder[:2]} {name:<24}{'   '.join(status)}")
    if os.path.exists("my-notes.md"):
        print("\n  Notes: my-notes.md")

    print()
    with_model = [f[:2] for f, _ in CHAPTERS if os.path.exists(os.path.join("chapters", f, "model", "model.safetensors"))]
    if with_model:
        print(f"  Furthest chapter with a model: {with_model[-1]}")
    else:
        print("  No chapters started yet. Start with Chapter 01: docs/when-slms-make-sense.md")
    if ready:
        print("  READY — everything needed to train is installed.")
    else:
        print("  NOT READY — run: python3 setup.py  (installs everything; takes a few minutes)")
    print()
    return ready


if "--check" in sys.argv:
    sys.exit(0 if check() else 1)

# ─────────────────────────────────────────────
# Step 1: Python version
# ─────────────────────────────────────────────
header("Step 1 of 5: Checking Python version")

version = sys.version_info
if version.major == 3 and 11 <= version.minor <= NEWEST_TESTED:
    ok(f"Python {version.major}.{version.minor}.{version.micro} — good")
elif version.major == 3 and version.minor > NEWEST_TESTED:
    ok(f"Python {version.major}.{version.minor}.{version.micro} — newer than this tutorial was tested with")
    info(f"If installing packages fails below, install Python 3.{NEWEST_TESTED} and run setup.py with it.")
else:
    fail(f"Python {version.major}.{version.minor} found — need 3.11 or higher")
    info("Download from: https://www.python.org/downloads/")
    info("On Windows: check 'Add Python to PATH' during install")
    sys.exit(1)

# ─────────────────────────────────────────────
# Step 2: Node.js
# ─────────────────────────────────────────────
header("Step 2 of 5: Checking Node.js")

ok_node, node_out = run("node --version")
if ok_node and node_out.startswith("v"):
    try:
        major = int(node_out.lstrip("v").split(".")[0])
        if major >= 20:
            ok(f"Node.js {node_out} — good")
        else:
            fail(f"Node.js {node_out} found — need v20 or higher")
            info("Download from: https://nodejs.org (choose the LTS version)")
            sys.exit(1)
    except ValueError:
        fail(f"Could not read Node.js version: {node_out}")
        sys.exit(1)
else:
    fail("Node.js not found")
    info("Download from: https://nodejs.org (choose the LTS version)")
    sys.exit(1)

# ─────────────────────────────────────────────
# Step 3: Python dependencies (in a virtual environment)
# ─────────────────────────────────────────────
header("Step 3 of 5: Installing Python dependencies")

# Create venv if it doesn't exist
if not os.path.exists(VENV_DIR):
    info("Creating a virtual environment (.venv)...")
    ok_venv, venv_out = run(f'"{sys.executable}" -m venv {VENV_DIR}')
    if not ok_venv:
        fail(f"Could not create virtual environment: {venv_out}")
        sys.exit(1)
    ok("Virtual environment created")
else:
    ok("Virtual environment already exists (.venv)")

# Install / upgrade pip silently
run(f'"{VENV_PYTHON}" -m pip install --upgrade pip --quiet')

# Install requirements
info("Installing Python packages (this takes a few minutes)...")
ok_pip, pip_out = run(f'"{VENV_PIP}" install -r requirements.txt', capture=False, timeout=None)
if not ok_pip:
    fail("pip install failed")
    info("Try deleting the .venv folder and running setup.py again")
    sys.exit(1)

# Verify imports
ok_imports, import_out = run(
    f'"{VENV_PYTHON}" -c "import transformers, datasets, sklearn, pandas, accelerate, torch; print(\'ok\')"'
)
if ok_imports and "ok" in import_out:
    ok("All Python packages installed and importable")
else:
    fail("Package import check failed")
    info(import_out)
    sys.exit(1)

# ─────────────────────────────────────────────
# Step 4: Node dependencies
# ─────────────────────────────────────────────
header("Step 4 of 5: Installing Node dependencies")

if os.path.exists("node_modules"):
    ok("node_modules already exists — skipping npm install")
else:
    info("Running npm install...")
    ok_npm, npm_out = run("npm install", capture=False, timeout=None)
    if not ok_npm:
        fail("npm install failed")
        info("Make sure Node.js 20+ is installed and try again")
        sys.exit(1)
    ok("Node packages installed")

# ─────────────────────────────────────────────
# Step 5: Ollama
# ─────────────────────────────────────────────
header("Step 5 of 5: Checking Ollama")

ok_ollama, ollama_out = run("ollama list")
if ok_ollama:
    ok("Ollama is installed and running")
    # Check for the general model Chapter 07 compares against
    ok_llm, _ = run(f"ollama show {COMPARE_MODEL}")
    if ok_llm:
        ok("qwen2.5:1.5b is downloaded (for the Chapter 07 comparison)")
    else:
        info("qwen2.5:1.5b not yet downloaded (about 1GB) — run this when ready:")
        info("  ollama pull qwen2.5:1.5b")
        info("(needed for the Chapter 07 comparison — not required for training)")
else:
    fail("Ollama not found or not running")
    info("Download from: https://ollama.com")
    info("Install it, open it once, then run setup.py again")
    info("(Ollama is needed for the comparison script in Chapter 07)")

# ─────────────────────────────────────────────
# Done
# ─────────────────────────────────────────────
print(f"\n{'═' * 50}")
print("  Setup complete.")
print('═' * 50)
print()
print("  Your environment is ready.")
print()
print("  Every time you open a new terminal, turn the environment on first:")
if IS_WINDOWS:
    print("       .venv\\Scripts\\activate")
else:
    print("       source .venv/bin/activate")
print()
print("  Next: start the tutorial at docs/when-slms-make-sense.md (Chapter 01).")
print("  Just want to see it run? Follow \"Quick start\" in README.md.")
print()
