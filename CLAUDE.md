@AGENTS.md

## Two agents, two machines — read before editing

Two Claude agents work on this project on separate machines. Follow
`COLLABORATION.md`: GitHub is the only shared copy, `git pull` before you
start, claim your area in `WORKING_ON.md` and push the claim first, work on a
`<machine>/<task>` branch, and merge back into `main` the same day.

## Test logins

Test with a **developer account**, one per machine. Sign in at `/auth/login`,
then switch role with the "Developer" pill at the bottom-left of every page or
the "Use the site as" block in the `/console` sidebar (Buyer, Seller, Agent,
Admin, back to Developer). Switching changes the account's real `role` claim,
so `firestore.rules` treats it exactly as that role; the account keeps a
`developer: true` claim, so it keeps the console and can always switch back.

This machine's login is in `TEST_ACCOUNTS.md` in this directory. That file is
gitignored and deliberately not committed: the accounts are real logins to the
live `dynasty-estates` Firebase project and this repository is public. Read it
there rather than pasting the password into code, commits, issues or anything
else that gets pushed. A machine without an account creates its own with
`node scripts/create-dev-account.mjs <email> "<name>" --key <service-account.json>`
(the key is not in git; ask the owner).

The four shared `demo.*@dynastyestates-demo.com` logins are **retired and
disabled** — their passwords are in git history. Do not re-enable them.
