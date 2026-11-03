@AGENTS.md

## Test logins

Four accounts exist, one per role (Buyer, Seller, Agent, Admin), for signing in
at `/auth/login` during testing. The credentials are in `TEST_ACCOUNTS.md` in
this directory.

That file is gitignored and deliberately not committed: the accounts are real
logins to the live `dynasty-estates` Firebase project and this repository is
public. Read it there rather than pasting the passwords into code, commits,
issues or anything else that gets pushed.

Roles come from the `role` custom claim on the Firebase Auth user, which is what
`firestore.rules` authorises against. `scripts/seed-firebase-roles.mjs` creates
and updates all four, and needs an Admin SDK service-account key that is not in
this checkout.
