# Chapter 09 — Make It Yours

## Before you start

**Your working folder for this chapter:** `chapters/09-make-it-yours/`

This chapter is different. There's no new code to run and no script to execute. Everything you need is already in the chapter folder — it's the complete final state of the project.

Open your terminal and navigate there:

```bash
cd chapters/09-make-it-yours
```

**✓ Confirm you're in the right place:**

```bash
ls
```

You should see the full project — all the training data, all the scripts, the server, the compare tool, everything. This is your starting point for your own use case.

---

**What you'll do in this chapter:**
- Decide if your problem is a good fit for this approach
- Identify the four files you need to change (and only four)
- Walk through the full adaptation process step by step
- Set up a production monitoring routine so the model doesn't quietly degrade

---

## What you can do now

You've built five transferable skills:

| Skill | What it means |
|-------|---------------|
| **Label design** | Turn a business question into a fixed set of categories |
| **Data quality** | Know the difference between a strong example and a misleading one |
| **Eval design** | Build a test that tells you the truth — not what you want to hear |
| **Deliberate tuning** | Study failures, change one thing, measure before claiming improvement |
| **Production thinking** | Know that a shipped model needs monitoring, not just testing |

These skills apply to any classification problem, not just customer feedback. The tool changes. The habit doesn't.

---

## Is your problem a good fit?

Before you start replacing files, run through this checklist:

- [ ] The output is one of a fixed set of categories — not open-ended text
- [ ] You have (or can create) at least 30–50 labeled examples per category
- [ ] You need consistent results across many runs, not a one-time answer
- [ ] The categories are stable — you won't be redefining them weekly

If all four are true, you have a good SLM use case.

If any are false, use Ollama for now and revisit when the conditions are met.

> [!TIP]
> **Tradeoff:** A fine-tuned model is more accurate and faster than prompting a general LLM at scale, but it requires upfront investment in labeling and eval design. For fewer than 100 classifications per week, the overhead may not be worth it. For recurring high-volume tasks, it almost always is.

---

## PM use cases that fit this template

These all have the same shape as the feedback classifier: fixed categories, labelable historical data, repeated task.

**Sales call objection classifier**
Labels: `pricing`, `timeline`, `technical_fit`, `competition`, `champion_risk`
Source data: CRM notes or call transcripts from closed/lost deals

**NPS response classifier**
Labels: `product_quality`, `support_quality`, `pricing`, `missing_feature`, `competitive_threat`
Source data: historical NPS survey verbatims with scores

**Support ticket router**
Labels: `onboarding`, `billing`, `api_integration`, `mobile`, `reporting`
Source data: past support tickets you've already routed manually

**User research note classifier**
Labels: `pain_point`, `workflow`, `workaround`, `delight`, `unmet_need`
Source data: past interview notes or synthesis docs

**The pattern in all of these:** You've already been doing the classification manually. The model learns from the decisions you've already made.

---

## The four files you change

Everything else stays the same. You don't touch the server, the training script logic, the eval runner, or the TypeScript client.

| File | What to change |
|------|----------------|
| `data/feedback.csv` | Replace with your labeled examples — same two-column format |
| `data/eval.csv` | Replace with your fixed eval — 15–20 examples per label, no overlap with training |
| `data/bad_eval.csv` | Optional — delete it or keep it as a reminder of what bad evals look like |
| `src/compare.ts` | Update `TEST_EXAMPLES` with examples from your domain |

The training script (`train.py`) auto-detects your labels from the CSV — you don't hardcode them anywhere. Whatever labels appear in your `feedback.csv`, the model learns to predict.

---

## Step-by-step: adapt the template

### Step 1 — Define your labels

Write one sentence for each category. Print it out. Keep it visible while you label.

**Example — sales objection classifier:**
- `pricing` — the customer said the cost is too high or out of budget
- `timeline` — the customer needs more time before deciding or can't start yet
- `technical_fit` — the customer questions whether the product integrates with their stack
- `competition` — the customer mentioned a competitor they're evaluating
- `champion_risk` — the customer's internal sponsor left, changed roles, or lost budget authority

**Lock these definitions before you label a single row.** Write them down. The model learns your definitions — not a general interpretation of the words.

---

### Step 2 — Collect and label your training data

Aim for 30–50 labeled examples per category. Quality matters more than volume.

**Where to get examples:**
- CRM notes from past deals (already categorized by outcome)
- Support tickets you've manually triaged
- NPS responses from past surveys
- Interview transcripts you've already analyzed

**Open `chapters/09-make-it-yours/data/feedback.csv` in your text editor.** Delete all the existing rows (keep the header line: `text,label`). Add your own examples in the same format:

```csv
text,label
"We love the product but our CFO won't approve anything over $20k.",pricing
"Our IT team needs three months to review the security docs before we can proceed.",timeline
```

**Before you train:** read 20 random rows aloud. Would a new team member label them the same way? If not, fix the ambiguous ones.

---

### Step 3 — Build your fixed eval first

Build the eval before you train the model. This is the discipline that separates teams that improve their models from teams that spin their wheels.

**Open `data/eval.csv` in your text editor.** Delete all existing rows (keep the header). Add your own eval examples:

Your fixed eval needs:
- **No overlap with training data** — zero shared rows
- **15–20 examples per label** — enough to surface systematic failures
- **Hard cases** — examples that sit near a category boundary, mixed-signal text
- **Realistic phrasing** — pulled from real data, not written to be easy

---

### Step 4 — Train the baseline

```bash
source .venv/bin/activate    # Mac/Linux
python3 train.py
```

Same command. Different data. The first run number is not a verdict — it's a starting point.

---

### Step 5 — Run the fixed eval and diagnose

```bash
python3 score_eval.py --eval data/eval.csv
```

Read the confusion matrix. Which label has the lowest F1? Which pairs of labels are getting confused? Read the actual mistake examples — not just the counts.

Record the baseline in `experiment-log.md`. You need this before you change anything.

---

### Step 6 — Tune deliberately

Follow the same loop from Chapter 06:
1. Pick the weakest label
2. Read the failures to understand *why* (not just *that* it's failing)
3. Add 10–15 targeted examples covering the specific failure pattern
4. Retrain, re-eval, compare before and after F1
5. Repeat until every label is above F1 = 0.80, or you've decided good enough

One change per run. Same fixed eval every time.

---

### Step 7 — Serve it

```bash
npm run start
```

Same server, same endpoint. Your domain's labels come out instead of customer feedback labels. The API shape is identical:

```
POST /classify { "text": "..." } → { "label": "...", "confidence": 0.xx }
```

---

## Production monitoring

A model you ship is a model you maintain.

### Monthly spot-check — 30 minutes

1. Pull 50 examples from your real classification history from the past 30 days
2. Label them yourself — don't look at what the model said first
3. Save them as a CSV: `data/spot-check-YYYY-MM.csv`
4. Run the scorer:

```bash
python3 score_eval.py --eval data/spot-check-YYYY-MM.csv
```

5. Compare each label's F1 to your baseline in `experiment-log.md`

### Signals that mean retrain

| Signal | What it means |
|--------|--------------|
| Any label's F1 drops >0.10 from baseline | Model has a new blind spot — add fresh examples and retrain |
| Average confidence drops below 0.70 | Data distribution has drifted — collect new training examples |
| A label that was rare is now common | Customer behavior changed — add more examples of that label |
| You read a batch and labels look wrong | Trust your judgment — something shifted, check the confusion matrix |

**Trigger for immediate review:** a product release, a pricing change, a new customer segment, or a support workflow change. Any of these can create ticket patterns the model has never seen. Check within 2 weeks of a major change.

> [!NOTE]
> **Your job:** Production monitoring is not a technical job. It's a product habit — the same way you'd check NPS after a product launch or support volume after a pricing change. The model is part of your workflow now. A 30-minute monthly check is how you keep it trustworthy.

> [!IMPORTANT]
> **Customer impact:** A model that degrades silently routes feedback to the wrong team for weeks before anyone notices. Monthly monitoring means you catch it when 5 tickets are wrong, not when 500 are.

---

## What not to commit

| Path | Why |
|------|-----|
| `model/` | Too large, gitignored — regenerate with `python3 train.py` |
| `.env` | Contains your Supabase keys — gitignored, never commit |
| `.venv/` | Virtual environment — gitignored, regenerate with `pip install -r requirements.txt` |
| `data/spot-check-*.csv` | Local monitoring samples — add to `.gitignore` |

What you should commit: your CSV data files, your experiment log, and your label definitions.

---

## What this tutorial actually taught

Not how to build a customer feedback classifier. The classifier was the vehicle.

**Label design is a product decision.** Your categories define what questions you can answer. Getting them wrong doesn't just hurt accuracy — it routes the wrong customer problems to the wrong people.

**An eval is a measurement tool, not a formality.** A bad eval produces confident wrong numbers. A good eval tells you exactly which categories fail and why. You can't improve what you can't measure honestly.

**Tuning is diagnosis, not guessing.** The confusion matrix shows you where the model is wrong. The mistakes list shows you why. You change one thing at a time because you need to know what moved the needle.

**A shipped model is a product, not a project.** It needs monitoring, not just testing. It will degrade when the world changes. The monthly spot-check is how you find out before your customers do.

**The boundary between Python and TypeScript is intentional.** Python trains. TypeScript serves. The model artifact is the handoff. This pattern works for any ML capability you add to a product.

These five habits transfer to any model you build, any tool you use, any use case you encounter. The specific code in this repo will become outdated. The habits won't.

---

## What comes next

If you've finished the tutorial and want to go further:

- **More training data:** the single highest-leverage improvement for any model is more high-quality labeled examples, specifically for the categories it gets wrong
- **ONNX export:** convert the trained model to ONNX format for faster inference and easier deployment
- **Batch classification:** classify your full inbox weekly by passing a CSV through the endpoint
- **Webhook integration:** connect `POST /classify` to your Zendesk or Intercom webhook to classify tickets automatically as they arrive
- **Confidence thresholds:** route low-confidence predictions (< 0.75) to a human review queue instead of auto-labeling

None of these require rebuilding from scratch. They're extensions of the same foundation.

---

You have a working model. You know how it was built, how it was measured, and how it fails. That's more than most teams who ship AI features can say.

Go build something useful.
