<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project rules

## Code

- No comments in code: no explanatory comments, doc comments or section banners. Add one only when the request explicitly asks for it.
- Use bun only: `bun install`, `bun dev`, `bun run lint`. `bun.lock` is the only lockfile; never create `package-lock.json`, `yarn.lock` or `pnpm-lock.yaml`.
- Style existing components through their props (`className` and so on) instead of copying their styles. Extend an existing file before creating a new one.

## One task, one PR, one worktree

Tasks are GitHub issues: `gh issue list`, `gh issue view <n>`. Each issue is one PR, and each PR gets its own branch and its own git worktree. The issue body gives the branch, the worktree and any blocking issues; don't start an issue while its blockers are open.

- Never work on a task in the main checkout or in another task's worktree. If the task's worktree already exists, continue there.
- Start a task from the latest main, using the branch name from the issue:

  ```bash
  git fetch origin
  git worktree add ../porsche-ui-<slug> -b <type>/<slug> origin/main
  cd ../porsche-ui-<slug> && bun install
  ```

- Change only what the task needs. No drive-by refactors, no reformatting of untouched code, no fixes for other issues. Mention anything else you find in the PR description.
- Don't open, edit or close issues. The PR closes its issue on merge.
- Don't test changes in a browser: no dev server, screenshots or browser tools. I check every change in the app myself. Browser checks cost too many tokens, too much time and too much battery. Lint and type-check are the only checks.
- Before committing, `bun run lint` and `bunx tsc --noEmit` must pass. If either fails, stop, report the errors and commit nothing.
- Write commit messages with the `writing-commit-messages` skill (installed globally for Claude and Codex): `<type>(<scope>): <subject>`, imperative, 50 characters or less. Use the branch prefix as the type. Add a body only when the why isn't obvious.
- Don't push or open the PR until asked. The PR title is the issue title. The description starts with `Closes #<n>`, then says what changed and how to check it in the app.
- After the PR merges: `git worktree remove ../porsche-ui-<slug>` and `git branch -d <type>/<slug>`.

## Git safety and attribution

- Never add a `Co-Authored-By` trailer or a "Generated with" line. Don't mention Claude, Codex or AI in commits, PR titles, PR descriptions, code or docs.
- Never discard uncommitted work (`git checkout -- <file>`, `git restore`, `git reset --hard`, `git clean`, `git stash drop`), force-push or rewrite history without asking first.
