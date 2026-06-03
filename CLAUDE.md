# Small Language Models for PMs — Claude Context

Hands-on tutorial for PMs learning AI. Readers build a real customer feedback classifier using a fine-tuned small language model, then call it from TypeScript. No ML background required. Public, Apache-2.0.

## What It Teaches

- What a model actually is (by building one)
- When fine-tuning beats prompting — and when it doesn't
- How to evaluate a model honestly, including where it fails
- How a trained model fits into a TypeScript codebase
- What it costs to run at scale vs. a general-purpose local LLM

The classifier labels support tickets and NPS comments as: `bug_report`, `feature_request`, `pricing_concern`, `onboarding_friction`, or `praise`.

## Repo Structure

```
chapters/                    ← progressive chapter starters (each is self-contained)
  02-labels-and-data/        ← starter template for reader to fill in
  03-train-baseline/         ← solution from ch02 + train.py
  04-why-accuracy-lies/      ← solution from ch03 + bad_eval.csv + score_eval.py
  05-fixed-eval/             ← solution from ch04 + eval.csv
  06-tuning-loop/            ← solution from ch05 + tuning data + experiment-log
training/
  data/feedback.csv          ← 175 labeled examples (163 baseline + 12 tuning additions)
  data/eval.csv              ← 100-row fixed eval (20 per label, never used in training)
  data/bad_eval.csv          ← intentionally flawed eval for Chapter 04
  train.py                   ← fine-tune the model (only Python in the repo)
  score_eval.py              ← score any labeled CSV against the saved model
  experiment-log.md          ← track training runs and eval results
  model/                     ← saved model artifact (generated, gitignored)
src/
  server.ts                  ← Express server serving the model as an endpoint
  classify.ts                ← client: call endpoint, get a label back
  compare.ts                 ← side-by-side: fine-tuned model vs. Ollama
docs/
  02-labels-and-training-data.md
  03-train-baseline.md
  04-why-accuracy-lies.md
  05-fixed-eval.md
  getting_started.md
  when-slms-make-sense.md
```

**Chapter folders:** Each `chapters/NN-name/` is a self-contained working directory containing the completed state of all previous chapters. Readers work inside the chapter folder for that step. The root repo is the final reference solution. `training/model/` is gitignored everywhere — readers always run `train.py` to generate it.

## Key Commands

```bash
pip install -r requirements.txt    # Python deps (one time)
python training/train.py           # fine-tune the model
npm run start                      # serve the model (localhost)
npm run classify                   # run the classifier client
npm run compare                    # compare fine-tuned vs. Ollama
npm run clean                      # remove node_modules and model artifacts
```

## Requirements

- Python 3.10+, Node 20+, [Ollama](https://ollama.com) installed
- No API key needed — model runs locally after training

## Context Engine

Local context scout and JR code delegation at `http://localhost:8088`. Path prefix for this repo: `ryemyster/small-language-models-for-pms/`.

| Task | Call |
|------|------|
| Starting any non-trivial task | `POST /context` → read `context-bundle.md` |
| Find where a concept lives | `POST /find` |
| Understand a specific file | `POST /summarize` |
| Mechanical single-file generation | `POST /draft` → review → apply manually |
| Multi-file feature scaffold | `POST /scaffold` → review each → apply manually |
| After commits | `POST /diff-summary` → read risks |

Scout is read-only. Claude Code owns all file writes, architecture, and review.
If `/healthcheck` returns non-200, fall back to direct file reading — never block.

## Standards

- Docs target non-technical PMs — keep language plain, no jargon
- Code comments can assume developer literacy
- `training/model/` is gitignored — never commit model artifacts
- `src/compare.ts` must remain runnable as the key learning moment (fine-tuned vs. general model)
- Don't add framework complexity — this is a teaching repo, simplicity is the product
