# commit-issue

Stage all changed files, commit with a clear message, push to the develop branch, and close the corresponding GitHub issue.

## Usage

```
/commit-issue <issue-number> <short description>
```

Example: `/commit-issue 2 add when-slms-make-sense doc`

## Steps

1. Run `git status` to confirm what's staged and unstaged
2. Stage only the files relevant to this issue (never use `git add -A` blindly — check for .env or large binaries first)
3. Commit using this format:
   ```
   <short description> (closes #<issue-number>)

   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   ```
4. Push to `origin develop` using the `git@github-ryemyster` remote (not the default `github.com` remote — the SSH config uses a host alias)
5. Confirm the push succeeded and the issue is closed on GitHub

## Rules

- Never skip hooks (`--no-verify`)
- Never force push
- If the push fails with a permission error, check that the remote URL uses `git@github-ryemyster:ryemyster/...` not `git@github.com:...`
- Only commit files directly related to the issue — don't bundle unrelated changes
