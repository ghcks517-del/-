import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import defaultFirebaseConfig from "../firebase-applet-config.json" with { type: "json" };

interface FirebaseConfigShape {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  firestoreDatabaseId?: string;
  [key: string]: unknown;
}

let db: Firestore | null = null;

function resolveFirebaseConfig(): { config: FirebaseConfigShape; databaseId: string } {
  const baseConfig: FirebaseConfigShape = { ...(defaultFirebaseConfig as FirebaseConfigShape) };
  let envConfig: FirebaseConfigShape = {};

  if (process.env.FIREBASE_CONFIG) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_CONFIG);
      if (parsed && typeof parsed === "object") {
        envConfig = parsed;
      }
    } catch (e) {
      console.warn("Invalid FIREBASE_CONFIG environment variable; falling back to firebase-applet-config.json");
    }
  }

  const isDifferentProject =
    Boolean(envConfig.projectId) &&
    Boolean(baseConfig.projectId) &&
    envConfig.projectId !== baseConfig.projectId;

  const config: FirebaseConfigShape = isDifferentProject
    ? envConfig
    : { ...baseConfig, ...envConfig };

  const databaseId =
    process.env.FIREBASE_DATABASE_ID ||
    (isDifferentProject
      ? envConfig.firestoreDatabaseId || "(default)"
      : envConfig.firestoreDatabaseId || baseConfig.firestoreDatabaseId || "(default)");

  return { config, databaseId };
}

export function getDb(): Firestore {
  if (!db) {
    const { config, databaseId } = resolveFirebaseConfig();
    if (!config.projectId || !config.apiKey) {
      throw new Error("Firebase configuration is missing projectId or apiKey.");
    }
    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    db = getFirestore(app, databaseId);
  }
  return db;
}
