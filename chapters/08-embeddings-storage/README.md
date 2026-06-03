# Chapter 08 — Starting Point (Optional)

**Read first:** [docs/08-embeddings-storage.md](../../docs/08-embeddings-storage.md)

This chapter is optional. The core tutorial is complete at Chapter 07.

## What's in this folder

| File | Description |
|------|-------------|
| `data/feedback.csv` | 175 labeled examples |
| `data/eval.csv` | Fixed eval |
| `train.py`, `score_eval.py`, `requirements.txt` | Python training stack |
| `src/server.ts`, `src/classify.ts`, `src/compare.ts` | Chapter 07 TypeScript layer |
| `src/store.ts` | Classify + embed + store to Supabase — new this chapter |
| `src/search.ts` | Semantic similarity search — new this chapter |
| `supabase/migrations/` | SQL migration to run in your Supabase project |
| `package.json` | Includes `@supabase/supabase-js` |

## Before you start

1. Classifier server running: `npm run start`
2. Ollama running with embedding model: `ollama pull nomic-embed-text`
3. Supabase project created and `.env` file configured:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```
4. Migration run in Supabase SQL editor (`supabase/migrations/20240101000000_feedback_vectors.sql`)

## Run

```bash
npm install           # installs @supabase/supabase-js
npm run store         # classify + embed + store 8 examples
npm run search        # semantic similarity search
```
