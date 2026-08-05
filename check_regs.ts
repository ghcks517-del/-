import { getDb } from "./server/firebase.js";
import { collection, getDocs } from "firebase/firestore";
import * as dotenv from "dotenv";
dotenv.config();

async function run() {
    const db = getDb();
    const snap = await getDocs(collection(db, "regulations"));
    console.log("Regulations:");
    snap.docs.forEach(d => console.log(d.data().lawName));
    
    const snap2 = await getDocs(collection(db, "legislativeNotices"));
    console.log("Notices:");
    snap2.docs.forEach(d => console.log(d.data().title));
    process.exit(0);
}
run();
