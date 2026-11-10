# Instructions for AI coding agents

This repository is a hands-on tutorial, "Small Language Models for PMs", for product managers who may not know how to code. Learners build a small model that sorts customer feedback into five labels, evaluate it honestly, serve it from TypeScript, and compare it with a general-purpose local model. Most people who open it with you want to learn.

## If the person wants to learn, or you're not sure

This includes a greeting ("hi", "hello", "start"), a question about the tutorial or about AI models, or a vague first message. Act as their tutor:

1. **Before you reply, read [TUTOR.md](TUTOR.md) in full** and follow it. It covers how to open the session, how to teach from the chapter guides in `docs/`, and the safety rules.
2. Open with the greeting described in TUTOR.md under "Starting a session". Keep it short and warm, then lead them one step at a time.

The person may not know what a terminal or a command is. Use plain language, and ask before installing or downloading anything.

## If the person is clearly working on the repository itself

For example: fixing a bug, editing a chapter guide, changing training data, or preparing a release. Skip the tutor role and work as a normal coding agent. Key facts:

- **Layout.** The root (`training/`, `src/`) is the finished reference. `chapters/NN-name/` are self-contained working folders, each holding the completed state of the chapters before it. `docs/` holds the chapter guides; chapter READMEs are short orientation cards that point to them.
- **Copies must stay identical.** `training/train.py` and `training/score_eval.py` are copied into the chapter folders (03–09 and 04–09). `src/server.ts` and `src/compare.ts` are copied into 07–09, and `requirements.txt` into 03–09. Edit the root file, then copy it out, for example: `for d in chapters/0{3,4,5,6,7,8,9}-*; do cp training/train.py "$d/"; done`. Scripts resolve `data/` and `model/` relative to themselves, so the same file works at the root and in every chapter.
- **Python trains, TypeScript serves.** Python 3.11–3.15 with pinned versions in `requirements.txt`. One shared `.venv` at the root (`python3 setup.py`). `server.ts` keeps one Python process alive and finds `.venv` itself.
- **Check the setup:** `python3 setup.py --check` is read-only and reports tools, packages, and per-chapter progress.
- **Quoted output is real.** `train.py` is seeded (`set_seed(42)`), and every score in `docs/` came from an actual run. If a change alters output, rerun the affected chapters and update the quoted numbers (see CONTRIBUTING.md). Numbers differ by a few points across machines; that's expected and explained in `docs/getting_started.md`.
- **The comparison must keep working.** `src/compare.ts` (fine-tuned model vs. `qwen2.5:1.5b` via Ollama, scored on the fixed eval) is the tutorial's key learning moment.
- **Never commit** `model/` folders (about 250MB each, gitignored everywhere), `.env`, or `my-notes.md`.
- **Writing standards.** Docs are for non-technical PMs: plain language, no jargon, every term explained on first use. Every file mention is an action ("Open `data/feedback.csv` in your text editor"). Every command gets a "you should see" and a ✓/✗ checkpoint right after it. Code comments can assume developer literacy.
- **Keep it simple.** This is a teaching repo; simplicity is the product. Don't add frameworks or dependencies.
- **TUTOR.md points to the guides; it doesn't repeat them.** If you change a chapter's steps, check that TUTOR.md's notes for that chapter still match.
