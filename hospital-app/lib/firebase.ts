import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

/** Firebase App Hosting injects FIREBASE_WEBAPP_CONFIG at build (server). Client bundle may not have it; use initializeApp() with no args there. */
function getFirebaseConfig(): Record<string, string | undefined> {
  const webappConfig = process.env.FIREBASE_WEBAPP_CONFIG;
  if (webappConfig) {
    try {
      const parsed = JSON.parse(webappConfig) as Record<string, string>;
      return {
        apiKey: parsed.apiKey,
        authDomain: parsed.authDomain,
        projectId: parsed.projectId,
        storageBucket: parsed.storageBucket,
        messagingSenderId: parsed.messagingSenderId,
        appId: parsed.appId,
      };
    } catch {
      // fall through to env vars
    }
  }
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  const firebaseConfig = getFirebaseConfig();
  if (firebaseConfig.projectId && firebaseConfig.apiKey) {
    return initializeApp(firebaseConfig);
  }
  // App Hosting client: config may not be in the bundle; SDK can use no-arg init (see Firebase App Hosting docs)
  try {
    return initializeApp();
  } catch {
    throw new Error(
      "Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_PROJECT_ID and NEXT_PUBLIC_FIREBASE_API_KEY (or use Firebase App Hosting). See .env.example."
    );
  }
}

export const app = getFirebaseApp();
export const db: Firestore = getFirestore(app);
