# Deploying the Hospital Web App

## 1. Firebase environment variables (required)

The app needs Firebase config at **build time** (Next.js inlines `NEXT_PUBLIC_*` variables into the client bundle).

Set these in your CI/CD or hosting platform (e.g. GitHub Actions secrets, Vercel Environment Variables, Firebase Hosting config):

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Copy from Firebase Console → Project settings → Your apps → Web app config.

If these are missing when you build, the app will throw a clear error on load.

## 2. Firestore security rules (required for care centers to load)

By default, Firestore denies all reads and writes. This repo includes `firestore.rules` and `firebase.json` so the `careCenters` collection is readable and writable.

**Deploy the rules once** (from the `hospital-app` directory, with Firebase CLI logged in):

```bash
cd hospital-app
firebase deploy --only firestore
```

If you use a different Firebase project for production, run `firebase use <project-id>` first.

After deploying rules, the care centers list and forms will work in production.
