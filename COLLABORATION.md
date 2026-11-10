# Working together on Dynasty Estates

Two Claude agents work on this project at the same time, **on two separate
machines**. The owner's one hard requirement:

> I do not want it to end up as 2 separate applications that can't merge.

Everything below exists to keep that true. If you are an agent reading this at
the start of a session, follow it before you edit anything.

## The one rule

**GitHub is the only shared copy.** `https://github.com/Divanvj/Dynasty-Estates`,
branch `main`.

Each machine has its own clone. Nothing is shared by sitting in a folder, a
network drive, OneDrive, or the other machine's dev server. If it is not pushed,
the other agent cannot see it and will build on top of something else.

Do **not** set up a shared network folder that both machines edit. This project
already ran with two agents writing into one working tree, and it produced:
files rewritten under an agent mid-edit, a dev server hung for hours, two
processes fighting over `.next`, stale bundles that looked like real bugs, and
commits that had to be titled "another agent's in-progress work" because nobody
could tell whose change was whose. Git over a network share or OneDrive can also
corrupt `.git` itself.

## Every session

**Start**

1. `git fetch origin` then `git status`. If `main` is behind, `git pull --ff-only`.
2. Read `WORKING_ON.md`. Do not start on an area the other agent has claimed.
3. Claim your area in `WORKING_ON.md`, commit that one line, and push it
   immediately — before writing any code — so the other agent sees it.
4. Create a branch for the task (naming below).

**While working**

- Commit small and often, with messages that say *why*.
- Push your branch at least every couple of hours, even unfinished. A pushed
  branch is visible; an unpushed one is invisible.
- If you need to change a file in the other agent's claimed area, stop and say
  so in `WORKING_ON.md` first rather than editing it.

**Finish** (the same day — do not let a branch live overnight)

1. `git fetch origin` and merge the latest `main` into your branch.
2. Resolve conflicts, then run the checks below.
3. Merge into `main` and push.
4. Remove your line from `WORKING_ON.md` in the same push.
5. Delete the branch.

The merge on 2026-11-06 was hard because a branch had drifted nine commits
from `main` while both agents edited the property page. A branch that lives
for a day almost always merges with nothing to resolve.

## Branches

`<machine>/<short-task>`, for example `alet-elize/print-export` or
`other-pc/map-filters`. The prefix is the machine's name (`$env:COMPUTERNAME`
on Windows), so it is always obvious which agent owns a branch.

Never commit straight to `main` except the one-line claim in `WORKING_ON.md`.

## Before anything reaches `main`

Run from the app folder and see them pass — do not assume:

```bash
npx tsc --noEmit
npx eslint src
```

Lint currently carries 7 pre-existing warnings and **0 errors**; keep errors at
zero. Then open the pages you changed in a browser and check the console is
clean.

`.github/workflows/ci.yml` runs on GitHub for every push, so a broken merge is
caught before the other agent pulls it. A red CI run on `main` is the first
thing either agent fixes.

## Resolving conflicts

- Keep the structure from whichever side made the larger, deliberate change,
  and carry the other side's smaller fixes across by hand.
- Never resolve by taking one side of a whole file without reading what the
  other side changed. That is how fixes silently disappear.
- Read a "fix" before applying it to the merged version. On 2026-11-06 a
  light-mode contrast change would have *lowered* contrast on a dark panel it
  had been applied to mechanically.
- Write the reasoning into the merge commit message.

## Dev servers

Each machine runs **its own** dev server on `http://localhost:3000`
(`npm run dev` in the app folder).

The other machine may view this machine's server over the network to see work
in progress — that is fine for looking. Code never travels that way; it only
travels through git.

Never run `npm run build` against a folder whose dev server is running: both
write to `.next` and the running server breaks. To test a production build,
build from a separate `git worktree` with its own `.next`.

## Secrets and the public repo

This repository is **public**. Before pushing, check nothing secret is in the
diff: service-account JSON, `.env.local`, tokens, passwords.

- `.env.local` is gitignored. Each machine needs its own copy; the owner
  transfers it directly, not through git.
- `TEST_ACCOUNTS.md` (each machine's developer-account login) is gitignored for the same reason.
  The owner copies it to each machine directly.
- Service-account keys never enter the repo (`*-firebase-adminsdk-*.json` is
  ignored).
- Large generated files stay out too. The UX audit screenshots
  (`docs/ux-audit/screenshots/`) are ignored; regenerate them locally.

## Firebase

Both machines use the same live `dynasty-estates` project. Deploying rules
needs an interactive `firebase-tools` login on the machine doing the deploy.
Only one agent deploys a given rules change; say so in `WORKING_ON.md` first,
because a rules deploy affects the live app for everyone at once.
