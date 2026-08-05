import { Router } from "express";
import { setupAuthRoutes } from "./auth.js";
import { setupLawRoutes } from "./law.js";
import { setupSyncRoutes } from "./sync.js";
import { setupRevisionRoutes } from "./revisions.js";
import { setupLegislativeNoticeRoutes } from "./legislativeNotices.js";

const router = Router();

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

setupAuthRoutes(router);
setupLawRoutes(router);
setupSyncRoutes(router);
setupRevisionRoutes(router);
setupLegislativeNoticeRoutes(router);

export default router;
