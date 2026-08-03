import { Router } from "express";
import { RegulationRepository } from "../repositories.js";

export function setupLawRoutes(router: Router) {
  // Get all regulations
  router.get("/regulations", async (req, res) => {
    try {
      const regulations = await RegulationRepository.getAll();
      res.json(regulations);
    } catch (error) {
      console.error("Error fetching regulations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create new regulation
  router.post("/regulations", async (req, res) => {
    try {
      const data = req.body;
      const newReg = await RegulationRepository.create({
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastCheckedAt: null,
        lastSuccessfulCheckedAt: null,
      });
      res.status(201).json(newReg);
    } catch (error) {
      console.error("Error creating regulation:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update regulation
  router.put("/regulations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      await RegulationRepository.update(id, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating regulation:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Delete regulation
  router.delete("/regulations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await RegulationRepository.delete(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting regulation:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
