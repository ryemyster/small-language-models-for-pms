# run-ts

Run a TypeScript file using tsx and report the result clearly.

## Usage

```
/run-ts <file-path> [args]
```

Example: `/run-ts src/classify.ts`

## Steps

1. Check that `node_modules/` exists — if not, run `npm install` first
2. Run the file: `npx tsx <file-path> [args]`
3. Capture stdout and stderr
4. If it succeeds: print the output and confirm what happened (request sent, label returned, table printed, etc.)
5. If it fails: print the error, identify the likely cause in plain English, and suggest the fix

## Error diagnosis rules

- `Cannot find module`: run `npm install` — a dependency is missing
- `ECONNREFUSED localhost:3000`: the classifier server isn't running — start it first with `npm run start` in a separate terminal
- `ollama: command not found` or connection refused on Ollama port: Ollama isn't running — start it with `ollama serve`
- Type errors from tsc: these are caught before runtime by tsx — read the error line number and fix the type mismatch
- `tsx: command not found`: run `npm install` — tsx is a dev dependency

## Note on server + client

`src/server.ts` must be running before `src/classify.ts` or `src/compare.ts` will work.
They run in separate terminals. If unsure whether the server is up, check with `/check-env`.
