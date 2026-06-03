# Chapter 07 — Starting Point

**Read first:** [docs/07-serve-the-model.md](../../docs/07-serve-the-model.md)

## What's in this folder

| File | Description |
|------|-------------|
| `data/feedback.csv` | 175 labeled examples — completed from Chapter 06 |
| `data/eval.csv` | Fixed eval — 100 examples, 20 per label |
| `train.py` | Training script |
| `score_eval.py` | Eval scorer with confusion matrix |
| `experiment-log.md` | Experiment log — fill in your Chapter 06 results |
| `requirements.txt` | Python dependencies |
| `src/server.ts` | Express classifier server — new this chapter |
| `src/classify.ts` | Client that calls the endpoint — new this chapter |
| `src/compare.ts` | SLM vs. Ollama comparison — new this chapter |
| `package.json` | Node dependencies |

## Before you start

You need a trained model. Run Python training if you're starting here fresh:

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python3 train.py
```

## Setup and run

Install Node dependencies:

```bash
npm install
```

Start the classifier server (model loads once on startup):

```bash
npm run start
```

In a second terminal, classify some feedback:

```bash
npm run classify
```

Compare SLM vs. Ollama (Ollama must be running):

```bash
npm run compare
```

## Note on the model artifact

`training/model/` is gitignored. Run `python3 train.py` to generate it. The server will not start without it.
