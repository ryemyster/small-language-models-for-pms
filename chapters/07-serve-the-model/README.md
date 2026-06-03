# Chapter 07 — Serve the Model as a Local Endpoint

You're in the right place. Open the chapter guide and follow it:

→ **[docs/07-serve-the-model.md](../../docs/07-serve-the-model.md)**

---

## What's in this folder

**Carried from Chapter 06:**

| File | What it is |
|------|------------|
| `data/feedback.csv` | 175 labeled examples |
| `data/eval.csv` | Fixed eval |
| `train.py` | Training script |
| `score_eval.py` | Eval scorer |
| `experiment-log.md` | Experiment log |
| `requirements.txt` | Python dependencies |

**New this chapter:**

| File | What it is |
|------|------------|
| `src/server.ts` | Express server — loads the model once, serves `POST /classify` |
| `src/classify.ts` | Client — sends text, gets a label back |
| `src/compare.ts` | Side-by-side: fine-tuned model vs. TinyLlama |
| `package.json` | Node dependencies |

---

## Two terminals

The doc will have you run `npm run start` in one terminal and commands like `npm run classify` in a second. Keep both open — the server runs as long as the first terminal is running.
