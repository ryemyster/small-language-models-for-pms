# Chapter 04 — Why a High Accuracy Score Can Still Mean a Bad Model

Your model just printed a number. Maybe 82%. Maybe 91%. It looked good.

Here's the problem: that number came from testing the model on 33 randomly chosen examples from the same pool it trained on. It's the equivalent of giving a student a test made of questions from their own study guide. Of course they'll do well.

This chapter shows you three ways that eval score can lie — using a real broken eval dataset you can run yourself. By the end, you'll know what to look for before trusting any accuracy number.

---

## The study guide / test analogy

In Chapter 02, you built a study guide: 163 labeled examples the model trained on. In Chapter 03, you held back 20% of those as a "test set" and measured accuracy against them.

The problem: that test set was drawn from the same pool as the study guide. Some examples were very similar to ones in training. The model may have learned specific phrasings rather than general patterns. And 33 examples isn't enough to surface a systematic weakness — if the model is terrible at classifying Slack-style one-liners, that failure might not even show up in a 33-row sample.

A trustworthy eval needs to be:
- **Separate** — never included in training, never seen during fine-tuning
- **Fixed** — the same set every time you test, so results are comparable
- **Representative** — covering the full range of your real inbox: different tones, lengths, channel styles, and edge cases

You're building that in Chapter 05. First, you need to see what a bad eval looks like — so you can recognize one when you see it.

---

## Run the bad eval

There's a deliberately flawed eval dataset at `training/data/bad_eval.csv`. Run the scoring script against it:

```bash
python3 training/score_eval.py --eval training/data/bad_eval.csv
```

You'll see an accuracy score that looks reasonable — probably above 80%. Then look at the breakdown.

---

## The three problems in this dataset

### Problem 1: Rows copied from training data

Open `training/data/bad_eval.csv`. The first few rows are:

```
"The app crashes every time I try to export a report to PDF." → bug_report
"Hi Support, I'm getting a 500 error every time I try to export a report to PDF..." → bug_report
"CSV export producing scrambled column headers since last Tuesday." → bug_report
```

These are copied directly from `training/data/feedback.csv`. The model studied them. Getting them right isn't learning — it's memorization. Including training rows in your eval is like letting a student bring their homework to the exam and marking them right when they copy it.

What this inflates: overall accuracy. The model gets easy points on examples it already knows, which pushes the number up before it even touches a new example.

**The pattern to watch for:** If your eval set overlaps with your training set — even partially — your accuracy number is optimistic. Always check that your eval file and training file share no rows.

---

### Problem 2: Examples so obvious they prove nothing

Further down the bad eval:

```
"Something is broken." → bug_report
"It doesn't work." → bug_report
"Error." → bug_report
"Too expensive." → pricing_concern
"Add stuff." → feature_request
```

These are so vague that almost any classifier — including a naive keyword matcher — would get them right. "Error" → `bug_report`. "Too expensive" → `pricing_concern`. They add to your accuracy count without testing whether the model can handle anything realistic.

Your real inbox doesn't look like this. It looks like: `"3/10 — Product is genuinely good but we're a nonprofit and the pricing isn't sustainable. Reviewing alternatives at renewal."` That's a pricing concern — but it contains positive language, a score, and a churn signal all in one sentence. That's what the model needs to handle, and that's what your eval needs to test.

**The pattern to watch for:** If every example in your eval is unambiguous and short, you're not testing the hard cases. Good evals include boundary cases, mixed signals, and realistic phrasing — not idealized clean text.

---

### Problem 3: Too few examples per label — especially for the failing ones

Check the per-label breakdown from the scoring script:

```
bug_report         10/10  ← looks perfect
feature_request     3/3   ← looks perfect
pricing_concern     3/3   ← looks perfect
onboarding_friction 2/2   ← looks perfect
praise              0/0   ← category missing entirely
```

The bad eval has 10 `bug_report` examples and only 2 `onboarding_friction`. Worse, `praise` is missing completely. If the model has a systematic problem with `praise` — confusing it with `feature_request`, for example — this eval will never surface it. You'd ship a model with a blind spot you didn't know about.

Getting 2/2 on `onboarding_friction` tells you almost nothing. With two examples, the model could be right by chance. You need at least 15–20 examples per category to have any confidence in a per-label score.

**The pattern to watch for:** If any category has fewer than 10 examples in your eval, that category's score is noise. If a category is missing entirely, you're flying blind on it.

---

## Side by side: bad eval row vs. trustworthy eval row

| | Bad eval row | Trustworthy eval row |
|---|---|---|
| **bug_report** | `"Error."` | `"Bulk delete says 'success' but nothing actually gets deleted. Tried on three different projects."` |
| **pricing_concern** | `"Too expensive."` | `"3/10 — Product is good but we're a nonprofit and can't sustain the pricing. Reviewing alternatives at renewal."` |
| **onboarding_friction** | `"Setup was confusing."` | `"I was invited by a colleague. Clicked the link and it sent me to the homepage, not her workspace."` |
| **feature_request** | `"Add stuff."` | `"On a call with a prospect — they specifically asked if we have Jira two-way sync. We don't. Worth prioritising."` |

The trustworthy rows are specific, realistic, and drawn from the kinds of things that actually show up in your inbox — including channel-style variation, mixed signals, and real phrasing. They're harder. That's the point.

---

## What a high score on a bad eval actually tells you

Not much. Here's why:

- **Memorization**: the model got training examples right because it studied them, not because it generalized
- **Easy examples**: the model got obvious examples right because anything would
- **Missing categories**: the model's worst-performing label wasn't even tested

An accuracy number without knowing where those examples came from and how they were selected is not information. It's a feeling of confidence that hasn't been earned.

This is the exact pattern that causes teams to ship models that look fine in testing and fail on real data. The test was too easy, too close to training, or didn't cover the hard cases.

**The stakeholder consequence:** Every decision made downstream of an accuracy number — whether to ship, how much engineering to invest, what to put on the roadmap — is only as trustworthy as the eval that produced it. An 85% from a bad eval presented to leadership is not a conservative number being cautiously interpreted. It's a misleading number that will produce confident bad decisions. The eval is not a technical artifact. It's the evidence base for product decisions.

**The tradeoff:** Building a thorough eval takes time before you start tuning. It's tempting to skip it and go straight to improving the model. The cost of skipping is that you tune blindly — you don't know if a change actually helped, hurt a specific category, or did nothing. The upfront investment in a real eval set pays back every time you retrain. This is the same tradeoff as skipping user research to ship faster: you move quicker in the short term and slower for every decision after that.

**The missing-category problem as a PM pattern:** If `praise` isn't in your eval, you don't know whether the model handles it. That's the same as not tracking a metric you care about. PMs who don't measure `onboarding_friction` separately from `bug_report` routinely underestimate how much of their inbox is an onboarding problem — because it all gets lumped together. Not measuring something doesn't mean it isn't happening. It means you can't see it.

**The customer impact of a bad eval:** A model that passes a flawed eval gets shipped. It mislabels tickets at the same rate as an untested model — you just don't know it yet. The PM's five Monday-morning questions get answered with corrupted data. The team focuses on the wrong problems. Customers who took the time to write detailed, specific feedback find that nothing changes — not because the team didn't care, but because the feedback was routed to the wrong pile by a model that looked fine on paper. The bad eval doesn't just hurt your measurement. It breaks the feedback loop between your customers and your product team.

---

## What comes next

You now know what a bad eval looks like and why it produces misleading scores. In Chapter 05, you'll build the real thing: a fixed eval suite that's separate from training, covers every category with enough examples to surface real weaknesses, and includes the hard cases — ambiguous tickets, short Slack messages, mixed-signal NPS verbatims — that your model will actually face on Monday morning.

The score you get from that eval will be one you can trust.

---

**Next:** [Chapter 05 — Build a trustworthy fixed eval suite](05-fixed-eval.md)
