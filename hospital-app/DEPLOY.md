# Deploying the Hospital Web App

## 1. Firebase environment variables (required for client)

The **server/build** gets config from `FIREBASE_WEBAPP_CONFIG` on Firebase App Hosting. The **browser** only gets config if it’s in the client bundle. Next.js inlines `NEXT_PUBLIC_*` into the client; other env vars are not.

**Firebase App Hosting:** In the Firebase Console → App Hosting → your app → Environment variables, add these so they’re available at build time and the “View care centers” page works in the browser:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Copy values from Project settings → Your apps → Web app config. Redeploy after adding them.

**Other hosts (Vercel, etc.):** Set the same `NEXT_PUBLIC_FIREBASE_*` variables in your platform’s environment/config.

## 2. Firestore security rules (required for care centers to load)

By default, Firestore denies all reads and writes. This repo includes `firestore.rules` and `firebase.json` so the `careCenters` collection is readable and writable.

**Deploy the rules once** (from the `hospital-app` directory, with Firebase CLI logged in):

```bash
cd hospital-app
firebase deploy --only firestore
```

If you use a different Firebase project for production, run `firebase use <project-id>` first.

After deploying rules, the care centers list and forms will work in production.
