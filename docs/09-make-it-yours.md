# Chapter 09 — Make It Yours

You built a customer feedback classifier. You labeled data, trained a model, built a fixed eval, tuned it deliberately, served it as a local endpoint, and measured every step.

Now take those five skills and apply them to your actual problem.

This chapter shows you exactly which files to change, what to keep, how to build a trustworthy eval for a new use case, and how to monitor the model once it's running in production. By the end, you can close this tutorial and go build something that matters to your team.

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

Before you start, run through the checklist from Chapter 01:

- [ ] The output is one of a fixed set of categories — not open-ended text
- [ ] You have (or can create) at least 30–50 labeled examples per category
- [ ] You need consistent results across many runs, not a one-time answer
- [ ] The categories are stable — you won't be redefining them weekly

If all four are true, you have a good SLM use case. If any are false, use Ollama for now and revisit when the conditions are met.

> [!TIP]
> **Tradeoff:** A fine-tuned model is more accurate and faster than prompting a general LLM at scale, but it requires upfront investment in labeling and eval design. For fewer than 100 classifications per week, the overhead may not be worth it. For recurring high-volume tasks, it almost always is.

---

## PM use cases that fit this template well

These all have the same shape as the feedback classifier: fixed categories, labelable historical data, repeated task:

**Sales call objection classifier**
Labels: `pricing`, `timeline`, `technical_fit`, `competition`, `champion_risk`
Source data: call recording transcripts or CRM notes from closed/lost deals

**NPS response classifier**
Labels: `product_quality`, `support_quality`, `pricing`, `missing_feature`, `competitive_threat`
Source data: historical NPS survey verbatims with scores

**Support ticket router**
Labels: `onboarding`, `billing`, `api_integration`, `mobile`, `reporting`
Source data: past support tickets you've already routed manually

**User research note classifier**
Labels: `pain_point`, `workflow`, `workaround`, `delight`, `unmet_need`
Source data: past interview notes or synthesis docs

**Contract clause classifier**
Labels: `payment_terms`, `ip_ownership`, `liability`, `termination`, `sla`
Source data: past contracts with clauses you've already reviewed

**The pattern in all of these:** You've already been doing the classification manually. The model learns from the decisions you've already made.

---

## The four files you change

Everything else stays the same. You don't touch the server, the training script logic, the eval runner, or the TypeScript client.

| File | What to change |
|------|----------------|
| `training/data/feedback.csv` | Replace with your labeled examples — same two-column format |
| `training/data/eval.csv` | Replace with your fixed eval — 15–20 examples per label, no overlap with training |
| `training/data/bad_eval.csv` | Optional — keep it as a reminder of what bad evals look like, or delete it |
| `src/compare.ts` | Update `TEST_EXAMPLES` with examples from your domain |

The training script (`train.py`) auto-detects your labels from the CSV — you don't hardcode them anywhere. Whatever labels appear in your `feedback.csv`, the model learns to predict.

---

## Step-by-step: adapt the template

### 1. Define your labels

Write one sentence for each category. This is your labeling guide — print it out and keep it visible while you label.

Example for a sales objection classifier:
- `pricing` — the customer said the cost is too high or out of budget
- `timeline` — the customer needs more time before deciding or can't start yet
- `technical_fit` — the customer questions whether the product integrates with their stack
- `competition` — the customer mentioned a competitor they're evaluating
- `champion_risk` — the customer's internal sponsor left, changed roles, or lost budget authority

Lock these definitions before you label a single row. Write them down. The model learns your definitions — not a general interpretation of the words.

### 2. Collect and label your training data

Aim for 30–50 labeled examples per category. More is better up to a point, but quality matters more than volume.

**Where to get examples:**
- CRM notes from past deals (already categorized by outcome)
- Support tickets you've manually triaged
- NPS responses from past surveys
- Interview transcripts you've already analyzed

**Format:** same as `training/data/feedback.csv`:

```csv
text,label
"We love the product but our CFO won't approve anything over $20k.",pricing
"Our IT team needs three months to review the security docs before we can proceed.",timeline
```

**Before you train:** read 20 random rows aloud. Would a new team member label them the same way you did? If not, fix the ambiguous ones.

### 3. Build your fixed eval first

Build the eval before you train the model. This is the discipline that separates teams that improve their models from teams that spin their wheels.

Your fixed eval needs:
- **No overlap with training data** — zero shared rows
- **15–20 examples per label** — enough to surface systematic failures
- **Hard cases** — examples that sit near a category boundary, mixed-signal text, short messages, long messages, different tones
- **Realistic phrasing** — pulled from real data, not written to be easy

Run it against your baseline model and record the scores in `training/experiment-log.md`. Those numbers are your ruler for every future change.

### 4. Train the baseline

```bash
source .venv/bin/activate
python3 training/train.py
```

Same command. Different data. The script reads whatever labels are in your CSV and trains on them.

Expect 15–30 minutes on a laptop CPU. The first run number is not a verdict — it's a starting point.

### 5. Run the fixed eval and diagnose

```bash
python3 training/score_eval.py --eval training/data/eval.csv
```

Read the confusion matrix. Which label has the lowest F1? Which pairs of labels are getting confused? Read the actual mistake examples — not just the counts.

Record the baseline in your experiment log. You need this before you change anything.

### 6. Tune deliberately

Follow the same loop from Chapter 06:
- Pick the weakest label
- Read the failures to understand *why* (not just *that* it's failing)
- Add 10–15 targeted examples covering the specific failure pattern
- Retrain, re-eval, compare before and after F1
- Repeat until every label is above F1 = 0.80, or you've decided good enough

One change per run. Same fixed eval every time.

### 7. Serve it

```bash
npm run start
```

Same server, same endpoint. Your domain's labels come out instead of customer feedback labels. The API shape is identical: `POST /classify { text } → { label, confidence }`.

---

## Production monitoring

A model you ship is a model you maintain. Here's the minimal version of a monitoring routine.

### Monthly spot-check (30 minutes)

1. Pull 50 examples from your real classification history from the past 30 days
2. Label them yourself — don't look at what the model said first
3. Save them as a CSV: `training/data/spot-check-YYYY-MM.csv`
4. Run the scorer: `python3 training/score_eval.py --eval training/data/spot-check-YYYY-MM.csv`
5. Compare each label's F1 to your experiment log baseline

**Signals that mean retrain:**

| Signal | What it means |
|--------|--------------|
| Any label's F1 drops >0.10 from baseline | Model has a new blind spot — retrain with fresh examples |
| Average confidence drops below 0.70 | Data distribution has drifted — collect new training examples |
| Label that was rare is now common | Customer behaviour changed — add more examples of that label |
| You read a batch and labels look wrong | Trust your judgment — something shifted, investigate the confusion matrix |

**Trigger for immediate review:** a product release, a pricing change, a new customer segment, or a support workflow change. Any of these can create ticket patterns the model has never seen. Check within 2 weeks of a major change.

> [!NOTE]
> **Your job:** Production monitoring is not a technical job. It's a product habit — the same way you'd check NPS after a product launch or support volume after a pricing change. The model is part of your workflow now. A 30-minute monthly check is how you keep it trustworthy.

> [!IMPORTANT]
> **Customer impact:** A model that degrades silently routes feedback to the wrong team for weeks before anyone notices. Monthly monitoring means you catch it when 5 tickets are wrong, not when 500 are.

---

## What not to commit

| Path | Why |
|------|-----|
| `training/model/` | Too large, gitignored — regenerate with `python3 training/train.py` |
| `.env` | Contains your Supabase keys — gitignored, never commit |
| `.venv/` | Virtual environment — gitignored, regenerate with `pip install -r requirements.txt` |
| `training/data/spot-check-*.csv` | Local monitoring samples — add to `.gitignore` if you use this pattern |

What you should commit: your CSV data files, your experiment log, and your label definitions (document them in a comment at the top of `feedback.csv` or in a separate `LABELS.md`).

---

## What this tutorial actually taught

Not how to build a customer feedback classifier. The classifier was the vehicle.

What you learned:

**Label design is a product decision.** Your categories define what questions you can answer. Getting them wrong doesn't just hurt accuracy — it routes the wrong customer problems to the wrong people.

**An eval is a measurement tool, not a formality.** A bad eval produces confident wrong numbers. A good eval tells you exactly which categories fail and why. You can't improve what you can't measure honestly.

**Tuning is diagnosis, not guessing.** The confusion matrix shows you where the model is wrong. The mistake list shows you why. You change one thing at a time because you need to know what moved the needle.

**A shipped model is a product, not a project.** It needs monitoring, not just testing. It will degrade when the world changes. The monthly spot-check is how you find out before your customers do.

**The boundary between Python and TypeScript is intentional.** Python trains. TypeScript serves. The model artifact is the handoff. This pattern works for any ML capability you add to a product — keep training and serving separate, and both sides stay simple.

These five habits transfer to any model you build, any tool you use, any use case you encounter. The specific code in this repo will become outdated. The habits won't.

---

## What comes after this

If you've finished the tutorial and want to go further:

- **More training data:** the single highest-leverage improvement for any model is more high-quality labeled examples, specifically for the categories it gets wrong
- **ONNX export:** convert the trained model to ONNX format for faster inference and easier deployment outside Python
- **Batch classification:** instead of one ticket at a time, classify your full inbox weekly by passing a CSV through the endpoint
- **Webhook integration:** connect `POST /classify` to your Zendesk or Intercom webhook to classify tickets automatically as they arrive
- **Confidence thresholds:** route low-confidence predictions (< 0.75) to a human review queue instead of auto-labeling them

None of these require rebuilding from scratch. They're extensions of the same foundation.

---

You have a working model. You know how it was built, how it was measured, and how it fails. That's more than most teams who ship AI features can say.

Go build something useful.
