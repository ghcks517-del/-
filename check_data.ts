import { getDb } from "./server/firebase.js";
import { collection, getDocs } from "firebase/firestore";
import * as dotenv from "dotenv";
dotenv.config();

async function run() {
    const db = getDb();
    const snap = await getDocs(collection(db, "revisions"));
    console.log("revisions length:", snap.size);
    if(snap.size > 0) {
        console.log(snap.docs.map(d => d.data().promulgationDate).slice(0, 5));
    }
    const snap2 = await getDocs(collection(db, "legislativeNotices"));
    if(snap2.size > 0) {
        console.log(snap2.docs.map(d => d.data().startDate).slice(0, 5));
    }
    process.exit(0);
}
run();
