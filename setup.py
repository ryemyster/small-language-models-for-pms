"""
setup.py — One-time setup for Small Language Models for PMs.

Run this first. It checks what you need, installs what's missing,
and tells you exactly what to do if something goes wrong.

Works on Mac, Windows, and Linux.

Run with:
  python3 setup.py     (Mac / Linux)
  python setup.py      (Windows)
"""

import subprocess
import sys
import os
import shutil
import platform

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def run(cmd, capture=True):
    """Run a shell command. Return (success, output)."""
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=capture,
            text=True, timeout=300
        )
        return result.returncode == 0, (result.stdout + result.stderr).strip()
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

# ─────────────────────────────────────────────
# Step 1: Python version
# ─────────────────────────────────────────────
header("Step 1 of 5: Checking Python version")

version = sys.version_info
if version.major == 3 and version.minor >= 10:
    ok(f"Python {version.major}.{version.minor}.{version.micro} — good")
else:
    fail(f"Python {version.major}.{version.minor} found — need 3.10 or higher")
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
ok_pip, pip_out = run(f'"{VENV_PIP}" install -r requirements.txt', capture=False)
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
    ok_npm, npm_out = run("npm install", capture=False)
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
    # Check for llama3
    ok_llama, _ = run("ollama show llama3 2>/dev/null || ollama show llama3:latest 2>/dev/null")
    if not ok_llama:
        info("llama3 model not yet downloaded — run this when ready:")
        info("  ollama pull llama3")
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
print("  Your environment is ready. Next steps:")
print()
print("  1. Train the model (15–30 minutes on a laptop CPU):")

if IS_WINDOWS:
    print(f"       .venv\\Scripts\\python training\\train.py")
else:
    print(f"       source .venv/bin/activate")
    print(f"       python3 training/train.py")

print()
print("  2. Start the classifier server:")
print("       npm run start")
print()
print("  3. Classify some feedback:")
print("       npm run classify")
print()
print("  See README.md or docs/getting_started.md for the full guide.")
print()
