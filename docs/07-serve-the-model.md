# Chapter 07 — Serve the Model as a Local Endpoint

## Before you start

**Your working folder for this chapter:** `chapters/07-serve-the-model/`

Open your terminal and navigate there:

```bash
cd chapters/07-serve-the-model
```

**✓ Confirm you're in the right place:**

```bash
ls
```

You should see:

```
README.md   data/   experiment-log.md   package.json   requirements.txt   score_eval.py   src/   train.py
```

```bash
ls src/
```

You should see:

```
classify.ts   compare.ts   server.ts
```

**You need a trained model.** Check:

```bash
ls model/
```

**✓ If you see `model.safetensors`**, you're ready.

**✗ If the model folder is missing**, run training first:

```bash
python3 -m venv .venv
source .venv/bin/activate    # Mac/Linux — use .venv\Scripts\activate on Windows
pip install -r requirements.txt
python3 train.py
```

Wait for `=== Done ===`, then come back.

---

**What you'll do in this chapter:**
- Start the model as a running HTTP server
- Call it with a real piece of feedback text and get a label back
- Compare your fine-tuned model against Ollama side by side
- Understand how to wire this endpoint into any tool your team uses

**What you'll have when you're done:**
- A live local API at `http://localhost:3000/classify`
- A clear picture of the latency and accuracy difference between a fine-tuned model and a general LLM

---

## The pattern: Python trains, TypeScript serves

Right now your model is a file. You can't call it from Slack, Zendesk, or any other tool. This chapter turns it into a service.

```
Python trains → saves model to disk → TypeScript loads it as a service → everything else calls the endpoint
```

The boundary is intentional. Python is the right tool for ML training. TypeScript is the right tool for building services your product integrates with. The model file (`model/`) is the handoff point. Python writes it. TypeScript serves it.

> [!NOTE]
> **Your job:** Once the model is behind an endpoint, it stops being an "ML project" and becomes a service — the same mental model as any API your product depends on. You can version it, monitor it, swap it for a better model without changing the callers, and document it with a simple spec: `POST /classify { text } → { label, confidence }`. That's a product decision, not a technical one.

---

## Step 1 — Install Node dependencies

Make sure you're in `chapters/07-serve-the-model/`, then:

```bash
npm install
```

**✓ If it worked**, you'll see something like:

```
added 47 packages in 3s
```

**✗ If you see `npm: command not found`**, Node.js isn't installed or isn't on your PATH. Go back to [Getting Started](getting_started.md) and follow Step 2.

---

## Step 2 — Open the server file

**Open `chapters/07-serve-the-model/src/server.ts` in your text editor.**

Scan through it. You don't need to understand every line. Notice:

- Near the top: code that starts a Python subprocess (that's the model running inside the server)
- A `POST /classify` route — this is what accepts text and returns a label
- A `GET /health` route — this tells you whether the model finished loading

The model loads **once** when the server starts. Every classification request after that goes to the already-loaded model. This is important — you'll see why in a moment.

---

## Step 3 — Start the server

```bash
npm run start
```

**✓ Within 10–20 seconds, you should see:**

```
Starting classifier subprocess...
[classifier] Loading model from disk...
[classifier] Model ready. Waiting for requests...

Classifier server ready at http://localhost:3000
POST http://localhost:3000/classify  { "text": "your feedback here" }
GET  http://localhost:3000/health
```

The key line is **"Model ready."** That's the Python subprocess confirming the model loaded successfully.

**Why it takes 10–20 seconds to start:** Loading a 250MB model from disk takes time. But it only happens once. Every classification request after this takes under 100ms — not because the model got smaller, but because it's already in memory.

This is the same reason you don't open a database connection for every query. You open it once, keep it alive, and reuse it.

**Keep this terminal window open.** The server runs as long as this terminal is running.

**✗ If you see `Model not found`**:
The model needs to exist before the server can load it. Open a second terminal, navigate to `chapters/07-serve-the-model/`, and run `python3 train.py`. Come back when training finishes.

**✗ If you see port 3000 already in use**:
Something else is running on that port. Run `lsof -ti:3000 | xargs kill` to clear it, then try `npm run start` again.

---

## Step 4 — Classify your first piece of feedback

**Open a new terminal window.** (Keep the server terminal running.)

Navigate to the same chapter folder:

```bash
cd chapters/07-serve-the-model
```

Run the classifier client:

```bash
npm run classify
```

**✓ You should see output like:**

```
Text:       The dashboard crashes every time I try to export to PDF.
Label:      bug_report
Confidence: 94.3%
────────────────────────────────────────────────────────────

Text:       It would be great if you could add a Slack integration.
Label:      feature_request
Confidence: 91.7%
────────────────────────────────────────────────────────────
```

Each result arrives in under a second. The model is reading that text, breaking it into tokens, running it through the neural network, and returning the highest-probability label with its confidence score.

**What confidence means:** The model assigns a probability to each of the five labels. Confidence is the probability of the winning label. 94% means the model is very sure. 61% means the text sits close to a category boundary — weight that result accordingly.

> [!NOTE]
> **Your job:** Low-confidence results are flags, not failures. In a real workflow, you'd set a threshold — classify automatically when confidence > 80%, route to human review when it's below. That threshold is a product decision: how much do you trust the model vs. how much do you need a human in the loop?

> [!IMPORTANT]
> **Customer impact:** With the model running as a service, classification happens automatically as tickets arrive — not manually every Monday morning. A `bug_report` filed at 2am on a Sunday reaches the engineering queue before the team starts work, not after someone runs a script. Speed of routing is speed of response.

---

## Step 5 — Call the endpoint directly

You don't need the `classify.ts` script to use the endpoint. Any HTTP request works. **Open your terminal and try this:**

```bash
curl -X POST http://localhost:3000/classify \
  -H "Content-Type: application/json" \
  -d '{"text": "I signed up but had no idea what to do next. Completely lost."}'
```

**✓ You should see:**

```json
{ "label": "onboarding_friction", "confidence": 0.8812 }
```

This is the integration point. A Zendesk webhook, an NPS survey processor, a Slack bot — any of them can call this endpoint exactly the same way. The model doesn't care what's calling it. It sees text, returns a label.

---

## Step 6 — Check server health

```bash
curl http://localhost:3000/health
```

**✓ You should see:**

```json
{ "status": "ready", "model": "/path/to/chapters/07-serve-the-model/model" }
```

If the model is still loading, `status` will be `"loading"`. If the server crashed, it won't respond at all — check the server terminal for the error.

---

## Step 7 — Compare your model against Ollama

**Make sure Ollama is running.** On Mac, look for the llama icon in your menu bar. If it's not there, open the Ollama app.

Then pull the comparison model (if you haven't already):

```bash
ollama pull tinyllama
```

Now run the comparison — **in your second terminal, with the server still running in the first:**

```bash
npm run compare
```

This takes a few minutes. Ollama generates responses one token at a time.

**✓ You should see a table like:**

```
──────────────────────────────────────────────────────────────────────────────────
Feedback                         Expected            SLM              Ollama
──────────────────────────────────────────────────────────────────────────────────
The app freezes every time...    bug_report          bug_report       bug_report
I'd love to assign tasks...      feature_request     feature_request  feature_request
I signed up but couldn't...      onboarding_friction onboarding_fric  bug_report
...

Accuracy — SLM: 19/20 (95%)   Ollama: 15/20 (75%)

── Speed ──────────────────────────────────────────────
SLM average latency:    45ms per prediction
Ollama average latency: 3200ms per prediction

── Projected time to classify N items ─────────────────
Volume       SLM              Ollama
────────────────────────────────────────────────────────
1,000        45s              53min
10,000       8min             9hr
100,000      1.2hr            3.7days
```

**Read the latency numbers.** The fine-tuned model is faster because it does exactly one thing. Ollama generates tokens one at a time — a process designed for flexible open-ended output, not structured classification.

> [!TIP]
> **Tradeoff:** You could classify with GPT-4o or Claude via API. The results would be comparable on accuracy. The key differences:
> - **Cost**: API providers charge per token. At 100k classifications, that's a real budget line. Your local model costs $0 per call after training.
> - **Latency**: API calls add network round-trip time. Your local model is purely local.
> - **Data**: API calls send your customer data to a third party. Your local model never leaves your machine.
> - **Control**: You can retrain your model. You can't retrain a provider's model.

---

## What you've built

At this point, the full pipeline exists:

```
Customer writes feedback
  → arrives in your inbox (Zendesk, Slack, NPS, email)
  → POST /classify
  → { label: "onboarding_friction", confidence: 0.88 }
  → routed to the right team
  → your five Monday-morning questions answered automatically
```

The model was trained on examples you labeled. Evaluated on a fixed suite you designed. Tuned based on specific failures you diagnosed. And it runs locally, costs nothing per call, and sends no customer data anywhere.

---

## If something goes wrong

**Server won't start — "Model not found"**
Run `python3 train.py` first. The model must exist before the server can load it.

**Server starts but `/classify` returns 503**
The model is still loading. Wait a few seconds and try again. Watch the server terminal — it will print "Model ready" when it's ready.

**`npm run compare` fails with ECONNREFUSED**
The server must be running before you run compare. Check your first terminal — if the server stopped, restart it with `npm run start`.

**Ollama errors in compare**
Make sure Ollama is running (`ollama serve`) and tinyllama is installed (`ollama pull tinyllama`). The classifier itself still works without Ollama — only the comparison step needs it.

---

**Next:** [Chapter 08 — Optional: store results with embeddings and Supabase](08-embeddings-storage.md)
