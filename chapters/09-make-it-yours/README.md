# Chapter 09 — Make It Yours

You're in the right place. Open the chapter guide and follow it:

→ **[docs/09-make-it-yours.md](../../docs/09-make-it-yours.md)**

---

## What's in this folder

This is the complete final state of the tutorial — everything built across Chapters 02–08. Use it as your starting point for your own use case.

| File / Folder | What it is |
|---------------|------------|
| `data/feedback.csv` | 175 labeled customer feedback examples — replace with yours |
| `data/eval.csv` | 100-row fixed eval — replace with yours |
| `data/bad_eval.csv` | Flawed eval reference from Chapter 04 |
| `train.py` | Training script — auto-detects your labels from the CSV |
| `score_eval.py` | Eval scorer — works with any labeled CSV |
| `experiment-log.md` | Track your training runs |
| `src/server.ts` | Classifier endpoint |
| `src/classify.ts` | TypeScript client |
| `src/compare.ts` | SLM vs. TinyLlama comparison |
| `src/store.ts` | Classify + embed + store (Chapter 08) |
| `src/search.ts` | Semantic search (Chapter 08) |
| `supabase/migrations/` | pgvector schema |

---

## The four files you replace

To adapt this for your own problem, change only these four:

1. `data/feedback.csv` — your labeled examples, same two-column format
2. `data/eval.csv` — your fixed eval, no overlap with training
3. *(optional)* `data/bad_eval.csv` — delete it or keep it
4. `src/compare.ts` — update `TEST_EXAMPLES` with your domain's text

Everything else — the server, the training script, the scorer — works with your data as-is.
