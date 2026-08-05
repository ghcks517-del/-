import { SyncService } from "./server/services/SyncService.js";
import * as dotenv from "dotenv";
dotenv.config();

async function run() {
    const s = new SyncService();
    await s.runMonthlySync("MANUAL");
    console.log("Done");
    process.exit(0);
}
run();
