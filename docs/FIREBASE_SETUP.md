# Firebase setup — Dynasty Estates

Project: **`dynasty-estates`** (number `920857909750`)

## Status — connected 2026-09-21

| Step | State |
| --- | --- |
| CLI login (`tricore.cloud@gmail.com`) | done |
| Web app registered — `1:920857909750:web:735ee5e3ec241057830fd7` | done |
| `.env.local` populated from `apps:sdkconfig` | done |
| Email/password + Google providers deployed | done |
| Cloud Firestore database created | done |
| `firestore.rules` deployed | done |
| Four role accounts created, profile docs written | done |
| **Role custom claims** | **outstanding — needs a service-account key** |
| **Phone auth provider** | **outstanding — console toggle only** |

Until the claims are set, `isAgentOrAdmin()` in the rules is false for everyone,
so agents and admins cannot read the enquiry and application queues. Everything
that depends only on ownership already works.


Auth model: the `role` **custom claim** on the ID token is the source of truth.
`firestore.rules` authorises against `request.auth.token.role`, so a role cannot
be forged by the client and rules need no extra document reads. The
`users/{uid}` document mirrors the role for display only.

Until `.env.local` is filled in, the app runs on the local demo personas in
`src/lib/demo-accounts.ts` and no Firebase call is made. That fallback is
deliberate — it keeps the shared demo link alive while the project is being
provisioned.

## Steps that need a signed-in human

These require an interactive Google OAuth flow, so they cannot be automated.

### 1. Sign in to the Firebase CLI

```bash
npx -y firebase-tools@latest login
# on a machine with no browser:
npx -y firebase-tools@latest login --no-localhost
```

### 2. Select the project and register the web app

```bash
npx -y firebase-tools@latest use dynasty-estates
npx -y firebase-tools@latest apps:create web dynasty-estates-web
```

Note the **App ID** it prints.

### 3. Pull the SDK config into `.env.local`

```bash
npx -y firebase-tools@latest apps:sdkconfig WEB --project dynasty-estates
```

Copy each value into `.env.local` using the key names in `.env.example`. All six
must be non-empty or the app stays on the demo fallback.

### 4. Enable the sign-in providers

Email/password and Google are declared in `firebase.json` and deploy with:

```bash
npm run firebase:deploy:auth
```

**Phone auth cannot be enabled from the CLI.** Only `emailPassword`,
`googleSignIn` and `anonymous` are supported in the `firebase.json` auth block.
Adding `"phone": true` there is **silently ignored** — the deploy still reports
only "email/password, Google sign-in" and exits 0, so do not trust a clean
deploy as evidence that phone is on (verified 2026-09-21).

Enable it in the console instead:

<https://console.firebase.google.com/project/dynasty-estates/authentication/providers>

→ **Phone** → toggle **Enable** → **Save**.

### Testing phone auth without sending real SMS

On the same Phone provider panel, expand **Phone numbers for testing** and add
a fictional number with a fixed code, for example `+27 82 123 4567` → `123456`.
That pair signs in without sending an SMS, costs nothing, does not touch the
SMS quota and never hits reCAPTCHA. Use these for the shared demo link, and for
anything automated — real numbers in a demo burn quota and cost money.

### Things that will bite

- **Billing.** Real SMS delivery needs the Blaze plan; SMS is charged per
  message and priced per destination country. Test numbers avoid this entirely.
- **Authorized domains.** Phone sign-in runs reCAPTCHA, so the serving hostname
  must be in **Authorized domains** (hostname only — no protocol, no port). The
  cloudflared demo link changes hostname on every restart, so it must be
  re-added each time the tunnel is recreated.
- **SMS abuse.** An open phone-auth form on a public URL can be used to burn
  your SMS budget. Before going live, set an SMS region policy (allow only the
  countries you serve) under Authentication → Settings.

### 5. Deploy the Firestore rules

```bash
npm run firebase:deploy:rules
```

### 6. Seed the four role accounts and their claims

Download a service-account key from
<https://console.firebase.google.com/project/dynasty-estates/settings/serviceaccounts/adminsdk>,
then:

```bash
npm run firebase:seed-roles -- --key ./service-account.json
```

Keep that key out of the repo — it grants full admin access to the project.

This creates (or updates) the four accounts, sets each one's `role` claim, and
writes the mirrored profile documents. Re-running it is safe.

## Roles

| Account                              | Claim    | Persona |
| ------------------------------------ | -------- | ------- |
| demo.buyer@dynastyestates-demo.com   | `buyer`  | Buyer   |
| demo.seller@dynastyestates-demo.com  | `seller` | Seller  |
| demo.agent@dynastyestates-demo.com   | `agent`  | Agent   |
| demo.admin@dynastyestates-demo.com   | `admin`  | Admin   |

New Google and phone sign-ups get no claim and therefore resolve to **Buyer**.
Promote someone by adding them to `scripts/seed-firebase-roles.mjs` and
re-running it, or by calling `setCustomUserClaims` directly.

A claim is baked into the ID token, so a role change is not visible until the
token refreshes (up to an hour) or the user signs out and back in. To force it
immediately, call `resolveUserRole(user, true)` from `src/lib/auth.ts`.

## Local emulators

```bash
npx -y firebase-tools@latest emulators:start
```

Auth on `9099`, Firestore on `8080`, UI on `4000` (see `firebase.json`).

## Important caveat

Role gating in the UI (`RoleGuard`) is presentation only — it runs on the
client. The real enforcement boundary is `firestore.rules`. Anything that must
genuinely be restricted has to be protected by those rules, or moved behind a
server-side check, not by hiding a route in the navigation.
