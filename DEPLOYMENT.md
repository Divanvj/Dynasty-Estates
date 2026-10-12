# Dynasty Estates Deployment

See the formal deployment specification in [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## Quick Deployment Steps
1. Run static checks: `npm run lint`
2. Compile build: `npm run build`
3. Deploy Firestore rules: `firebase deploy --only firestore:rules`
4. Deploy web application: `vercel --prod`

