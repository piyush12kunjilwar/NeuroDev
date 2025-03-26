import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  insertContributionSchema, 
  contributionTypeSchema, 
  insertIpfsStorageSchema, 
  ipfsContentTypeSchema,
  insertDatasetSchema 
} from "@shared/schema";
import { WebSocketHandler } from "./websocket";
import { mnistModel } from "./model";
import { 
  uploadToIPFS, 
  getFromIPFS, 
  pinToIPFS, 
  getIPFSGatewayUrl, 
  isIPFSConfigured 
} from "./ipfs";
import multer from "multer";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Initialize WebSocket handler
  const wsHandler = new WebSocketHandler(httpServer);

  // API routes
  
  // Models endpoints
  app.get("/api/models", async (req, res) => {
    try {
      const models = await storage.getAllModels();
      res.json(models);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch models" });
    }
  });

  app.get("/api/models/:id", async (req, res) => {
    try {
      const modelId = parseInt(req.params.id);
      const model = await storage.getModel(modelId);
      
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      
      res.json(model);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch model" });
    }
  });

  // Contributions endpoints
  app.get("/api/contributions", async (req, res) => {
    try {
      const modelId = req.query.modelId ? parseInt(req.query.modelId as string) : undefined;
      const status = req.query.status as string | undefined;
      
      let contributions;
      if (modelId) {
        contributions = await storage.getContributionsByModel(modelId);
      } else if (status) {
        contributions = await storage.getContributionsByStatus(status);
      } else {
        return res.status(400).json({ error: "Missing filter parameters" });
      }
      
      res.json(contributions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contributions" });
    }
  });

  app.get("/api/contributions/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const contributions = await storage.getContributionsByUser(req.user.id);
      res.json(contributions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user contributions" });
    }
  });

  app.post("/api/contributions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      // Validate request body
      const contributionData = insertContributionSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Create contribution
      const contribution = await storage.createContribution(contributionData);
      
      // Create activity entry
      const activity = await storage.createActivity({
        userId: req.user.id,
        modelId: contribution.modelId,
        action: "submitted_contribution",
        description: `Submitted a new ${contribution.type} contribution`,
        metadata: { contributionId: contribution.id }
      });
      
      // Notify via WebSocket
      wsHandler.broadcastContributionUpdate(contribution);
      wsHandler.broadcastNewActivity(activity);
      
      res.status(201).json(contribution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create contribution" });
    }
  });

  // Apply a contribution to the model (simplified for MVP)
  app.post("/api/contributions/:id/apply", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const contributionId = parseInt(req.params.id);
      const contribution = await storage.getContribution(contributionId);
      
      if (!contribution) {
        return res.status(404).json({ error: "Contribution not found" });
      }
      
      if (contribution.status !== "pending") {
        return res.status(400).json({ error: "Contribution already processed" });
      }
      
      // Apply the contribution
      const result = await mnistModel.applyContribution(contributionId, contribution.modelId);
      
      // Update WebSocket clients
      wsHandler.broadcastModelUpdate(contribution.modelId);
      wsHandler.notifyUserTokenUpdate(contribution.userId);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to apply contribution" });
    }
  });

  // Activity feed endpoints
  app.get("/api/activities/:modelId", async (req, res) => {
    try {
      const modelId = parseInt(req.params.modelId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const activities = await storage.getActivities(modelId, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Compute network endpoints
  app.post("/api/compute/register", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const user = await storage.setComputeProvider(req.user.id, true);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Broadcast updated stats
      wsHandler.broadcastStats();
      
      res.json({ success: true, computeProvider: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to register as compute provider" });
    }
  });

  app.post("/api/compute/contribute", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.user.id);
      if (!user || !user.computeProvider) {
        return res.status(403).json({ error: "Not registered as compute provider" });
      }
      
      const modelId = req.body.modelId ? parseInt(req.body.modelId) : 1; // Default to MNIST model
      
      // Simulate training step
      const result = await mnistModel.trainStep(user.id, modelId);
      
      // Update WebSocket clients
      wsHandler.broadcastModelUpdate(modelId);
      wsHandler.notifyUserTokenUpdate(user.id);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to contribute compute resources" });
    }
  });

  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const models = await storage.getAllModels();
      const pendingContributions = await storage.getContributionsByStatus('pending');
      const acceptedContributions = await storage.getContributionsByStatus('accepted');
      
      // Count users who are compute providers
      const users = Array.from((await Promise.all(
        Array.from({ length: 100 }, (_, i) => storage.getUser(i + 1))
      )).filter(user => user !== undefined) as Array<NonNullable<Awaited<ReturnType<typeof storage.getUser>>>>);
      
      const computeProviders = users.filter(user => user.computeProvider).length;
      
      res.json({
        activeModels: models.length,
        userContributions: req.isAuthenticated() 
          ? (await storage.getContributionsByUser(req.user.id)).length 
          : 0,
        computeContributors: computeProviders,
        totalContributions: pendingContributions.length + acceptedContributions.length
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  return httpServer;
}
