<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project rules

Explicit instructions in the current request override these defaults. Permission to push, open a PR or run the dev server covers follow-up work on the same task. Don't ask about anything these rules already decide; when a decision is mine, give a recommendation.

## Code

- No comments in code: no explanatory comments, doc comments or section banners. Add one only when the request explicitly asks for it.
- Use bun only: `bun install`, `bun dev`, `bun run lint`. `bun.lock` is the only lockfile; never create `package-lock.json`, `yarn.lock` or `pnpm-lock.yaml`.
- Style existing components through their props (`className` and so on) instead of copying their styles. Extend an existing file before creating a new one.

## Design

- Reuse existing spacing values and keep rem and em values simple, on a quarter-rem grid. Give equivalent controls the same dimensions.
- State changes animate with `motion` from the current state and never jump. New animations reuse the timing of existing ones.
- These ideas were tried and rejected; don't propose them again unless I bring them up: replacing the instrument cluster or adding a speed dial, a 3D road with traffic under the car, strip or bar driving layouts, a 360° spin-in on return to P, and headlight or beam effects on the 3D car.

## One task, one PR, one worktree

Tasks are GitHub issues: `gh issue list`, `gh issue view <n>`. By default each issue is one PR, and each PR gets its own branch and its own git worktree. If I name several issues for one PR, use one worktree and one branch. The issue body gives the branch, the worktree and any blocking issues; don't start an issue while its blockers are open.

- Never work on a task in the main checkout or in another task's worktree. If the task's worktree already exists, continue there.
- Start a task from the latest main, using the branch name from the issue. `bunx next typegen` generates the route types that `tsc` needs in a new worktree:

  ```bash
  git fetch origin
  git worktree add ../porsche-ui-<slug> -b <type>/<slug> origin/main
  cd ../porsche-ui-<slug> && bun install && bunx next typegen
  ```

- Change only what the task needs. No drive-by refactors, no reformatting of untouched code, no fixes for other issues. Mention anything else you find in the PR description.
- Don't create, edit or close issues unless I ask. New issues use the existing labels and give the branch, worktree and blockers in the same format as the existing ones. A PR closes its issues on merge.
- Don't test changes in a browser yourself: no screenshots or browser tools, and no dev server unless I ask for one. I check every change in the app myself. Lint and type-check are the only checks. When I ask for the dev server, stop the task's running server, start `bun dev` in the background from the task's worktree, and reply with the URL, the issue and PR numbers, and a short checklist of what to check.
- `bun run lint` and `bunx tsc --noEmit` must pass before any commit. If either fails, stop, report the errors and commit nothing. Once they pass, commit the task's changes, review fixes included, without asking; never leave fixes uncommitted.
- Write commit messages with the `writing-commit-messages` skill (installed globally for Claude and Codex): `<type>(<scope>): <subject>`, imperative, 50 characters or less. Use the branch prefix as the type. Add a body only when the why isn't obvious.
- Don't push or open the PR until asked. Once a PR is open, push follow-up commits to it. The PR title is the issue title. The description starts with a `Closes #<n>` line for each issue, then says what changed and how to check it in the app.
- Resolve conflicts by merging `origin/main` into the branch, not by rebasing. Rerun lint and type-check, then push.
- Keep READMEs, PR descriptions and issues short, and keep reference credits. When work is done, say what changed, which checks passed and exactly where to look in the app.
- Cleanup after a merge: check the PR is merged, and report any uncommitted changes or unpushed commits in the worktree before touching it. Stop only that task's dev server, then `git worktree remove ../porsche-ui-<slug>` and `git branch -d <type>/<slug>`, `git fetch --prune`, and fast-forward main if it's clean. "Next" means start the dev server for the next open PR.
- If I drop an idea: close the PR, remove the worktree, and delete the branch locally and on the remote.

## Git safety and attribution

- Never add a `Co-Authored-By` trailer or a "Generated with" line. Don't mention Claude, Codex or AI in commits, PR titles, PR descriptions, code or docs.
- Never discard uncommitted work (`git checkout -- <file>`, `git restore`, `git reset --hard`, `git clean`, `git stash drop`), force-push or rewrite history without asking first.
