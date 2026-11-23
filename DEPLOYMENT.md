# Dynasty Estates Deployment

See the formal deployment specification in [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## Quick Deployment Steps
1. Run static checks: `npm run lint`
2. Compile build: `npm run build`
3. Deploy Firebase rules or indexes (owner's OK first; needs the Firebase CLI login): `npm run firebase:deploy:rules`
   (also `:indexes`, `:storage`; add `-- --dry-run` to check without deploying). These always deploy what is on
   `origin/main`, refuse if your copy differs, and run `npm run test:rules` before the rules. See `scripts/firebase-deploy.mjs`.
4. Deploy the web application: push to `main`. Vercel is connected to the GitHub repo and deploys every push.

