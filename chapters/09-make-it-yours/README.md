# Chapter 09 — Starting Point (Final)

**Read first:** [docs/09-make-it-yours.md](../../docs/09-make-it-yours.md)

This folder contains the complete final state of the tutorial — everything built across chapters 02–08. Use it as a reference, or as the starting point for adapting the template to your own use case.

## What's in this folder

| File | Description |
|------|-------------|
| `data/feedback.csv` | 175 labeled customer feedback examples |
| `data/eval.csv` | 100-row fixed eval, 20 per label |
| `data/bad_eval.csv` | Intentionally flawed eval (chapter 04 reference) |
| `train.py` | Fine-tuning script |
| `score_eval.py` | Eval scorer with confusion matrix |
| `experiment-log.md` | Track your training runs |
| `requirements.txt` | Python dependencies |
| `src/server.ts` | Classifier endpoint (model loads once) |
| `src/classify.ts` | Client that calls the endpoint |
| `src/compare.ts` | SLM vs. Ollama comparison |
| `src/store.ts` | Classify + embed + store to Supabase |
| `src/search.ts` | Semantic similarity search |
| `supabase/migrations/` | pgvector schema migration |
| `package.json` | All Node dependencies |

## To adapt this for your own use case

1. Replace `data/feedback.csv` with your labeled examples (same two-column format)
2. Replace `data/eval.csv` with your fixed eval (no overlap with training, 15–20 per label)
3. Run `python3 train.py` — it auto-detects your labels from the CSV
4. Run `python3 score_eval.py --eval data/eval.csv` — record the baseline
5. Tune, retrain, re-eval until every label is above F1 = 0.80
6. `npm run start` — same server, your labels come out

See [docs/09-make-it-yours.md](../../docs/09-make-it-yours.md) for the full walkthrough.
