# Chapter 08 — Embeddings and Storage (Optional)

You're in the right place. Open the chapter guide and follow it:

→ **[docs/08-embeddings-storage.md](../../docs/08-embeddings-storage.md)**

This chapter is optional. The core tutorial is complete at Chapter 07.

---

## What's in this folder

**Carried from Chapter 07:**

| File | What it is |
|------|------------|
| `src/server.ts`, `src/classify.ts`, `src/compare.ts` | Chapter 07 TypeScript layer |
| `train.py`, `score_eval.py`, `requirements.txt` | Python training stack |
| `data/`, `experiment-log.md` | Training data and log |

**New this chapter:**

| File | What it is |
|------|------------|
| `src/store.ts` | Classify → embed → store to Supabase |
| `src/search.ts` | Semantic similarity search against stored feedback |
| `supabase/migrations/` | SQL migration — run once in your Supabase project |
| `.env` (you create this) | Your Supabase URL and anon key — gitignored |

---

## Before the doc can work

You'll need a Supabase project and a `.env` file with your credentials. The doc walks through both — don't skip the setup steps.
