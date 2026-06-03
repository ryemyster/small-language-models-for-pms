# Experiment Log

Record every training run here. One row per run. Never change a previous row — if a result was wrong, add a note column.

The fixed eval (`training/data/eval.csv`) must be used for every row. If you change the eval, start a new section and note why.

---

## Fixed eval: training/data/eval.csv (100 examples, 20 per label)

| Run | Date | What changed | Overall | bug_report F1 | feature_request F1 | onboarding_friction F1 | praise F1 | pricing_concern F1 | Notes |
|-----|------|-------------|---------|--------------|-------------------|----------------------|-----------|-------------------|-------|
| 0 (baseline) | | Nothing — first training run | | | | | | | Fill in from Chapter 05 eval output |
| 1 | | | | | | | | | |
| 2 | | | | | | | | | |
| 3 | | | | | | | | | |

---

## Rules

**One change per run.** If you add training examples AND increase epochs in the same run, you won't know which change moved the needle.

**Always run the same fixed eval.** Never test against your training data. Never test against a modified eval.

**Record before you retrain.** Write down what you're changing and why before you run anything. This forces you to have a hypothesis, not just a guess.

**A run that makes things worse is still useful.** Record it. It tells you the direction that doesn't work.

---

## When to stop tuning

Stop when one of these is true:

- Every label is above F1 = 0.80 on the fixed eval
- The weakest label has not improved across three consecutive runs
- Adding more examples is not feasible (you've run out of real inbox data to label)
- The model is good enough for the use case — the remaining errors are in categories where a wrong label has low consequence

"Good enough" is a product decision, not a technical one. A model that correctly sorts `bug_report` and `pricing_concern` 90% of the time may be perfectly useful even if `onboarding_friction` is at 0.75 — if your team is only acting on the first two categories today.
