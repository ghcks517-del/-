import { initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import fs from "fs";
import path from "path";

let db: Firestore | null = null;

export function getDb(): Firestore {
  if (!db) {
    let config: any = {};
    if (process.env.FIREBASE_CONFIG) {
      try { config = JSON.parse(process.env.FIREBASE_CONFIG); } catch(e){}
    }
    if (Object.keys(config).length === 0) {
      try {
        const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
        config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      } catch (e) {
        console.warn("Could not read firebase-applet-config.json");
      }
    }
    const app = initializeApp(config);
    db = getFirestore(app, config.firestoreDatabaseId || "(default)");
  }
  return db;
}
