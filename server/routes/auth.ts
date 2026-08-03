import { Router } from "express";

export function setupAuthRoutes(router: Router) {
  // Add auth-related API routes here
  router.get("/auth/session", (req, res) => {
    res.json({ message: "Auth routes setup" });
  });
}
