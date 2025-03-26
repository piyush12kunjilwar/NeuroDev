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

  // Setup file upload middleware
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB file size limit
    },
  });

  // IPFS Status endpoint
  app.get("/api/ipfs/status", (req, res) => {
    res.json({
      configured: isIPFSConfigured(),
      ready: isIPFSConfigured(), // In a real app, would check connection health
    });
  });

  // IPFS Upload endpoint (text content)
  app.post("/api/ipfs/upload/text", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      if (!isIPFSConfigured()) {
        return res.status(503).json({ error: "IPFS service not configured" });
      }

      const { content, contentType, fileName, description } = req.body;

      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      if (!contentType) {
        return res.status(400).json({ error: "Content type is required" });
      }

      // Upload to IPFS
      const cid = await uploadToIPFS(content);

      // Store reference in database
      const ipfsStorageRecord = await storage.createIpfsStorage({
        cid,
        contentType,
        fileName: fileName || null,
        fileSize: Buffer.byteLength(content, 'utf8'),
        description: description || null,
        userId: req.user.id
      });

      // Create activity entry for upload
      await storage.createActivity({
        userId: req.user.id,
        modelId: req.body.modelId || 1, // Default to the first model if not specified
        action: "uploaded_to_ipfs",
        description: `Uploaded ${contentType} content to IPFS`,
        relatedCid: cid
      });

      res.status(201).json({
        ...ipfsStorageRecord,
        gatewayUrl: getIPFSGatewayUrl(cid)
      });
    } catch (error) {
      console.error("IPFS upload error:", error);
      res.status(500).json({ 
        error: "Failed to upload to IPFS",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // IPFS Upload file endpoint
  app.post("/api/ipfs/upload/file", upload.single('file'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      if (!isIPFSConfigured()) {
        return res.status(503).json({ error: "IPFS service not configured" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { contentType, description } = req.body;
      
      if (!contentType) {
        return res.status(400).json({ error: "Content type is required" });
      }

      // Upload to IPFS
      const cid = await uploadToIPFS(req.file.buffer);

      // Store reference in database
      const ipfsStorageRecord = await storage.createIpfsStorage({
        cid,
        contentType,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        description: description || null,
        userId: req.user.id
      });

      // Create activity entry for upload
      await storage.createActivity({
        userId: req.user.id,
        modelId: req.body.modelId || 1, // Default to the first model if not specified
        action: "uploaded_to_ipfs",
        description: `Uploaded ${contentType} file to IPFS: ${req.file.originalname}`,
        relatedCid: cid
      });

      res.status(201).json({
        ...ipfsStorageRecord,
        gatewayUrl: getIPFSGatewayUrl(cid)
      });
    } catch (error) {
      console.error("IPFS file upload error:", error);
      res.status(500).json({ 
        error: "Failed to upload file to IPFS",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // IPFS Get content endpoint
  app.get("/api/ipfs/content/:cid", async (req, res) => {
    try {
      if (!isIPFSConfigured()) {
        return res.status(503).json({ error: "IPFS service not configured" });
      }

      const { cid } = req.params;

      // Get IPFS storage record to determine content type
      const ipfsRecord = await storage.getIpfsStorageByCid(cid);
      
      let content;
      try {
        content = await getFromIPFS(cid);
      } catch (error) {
        return res.status(404).json({ error: "Content not found on IPFS" });
      }

      if (ipfsRecord && ipfsRecord.contentType) {
        // If it's a file that should be downloaded
        if (['model', 'data', 'weights'].includes(ipfsRecord.contentType)) {
          res.setHeader('Content-Disposition', `attachment; filename="${ipfsRecord.fileName || cid}"`);
        }
      }

      res.send(content);
    } catch (error) {
      console.error("IPFS content retrieval error:", error);
      res.status(500).json({ 
        error: "Failed to retrieve content from IPFS",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // IPFS Pin content endpoint
  app.post("/api/ipfs/pin/:cid", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      if (!isIPFSConfigured()) {
        return res.status(503).json({ error: "IPFS service not configured" });
      }

      const { cid } = req.params;

      // Check if content exists
      const ipfsRecord = await storage.getIpfsStorageByCid(cid);
      if (!ipfsRecord) {
        return res.status(404).json({ error: "IPFS record not found" });
      }

      // Pin the content
      const pinned = await pinToIPFS(cid);
      if (!pinned) {
        return res.status(500).json({ error: "Failed to pin content" });
      }

      // Update storage record
      const updatedRecord = await storage.updateIpfsStoragePinStatus(cid, true);

      res.json({ 
        success: true, 
        pinned: true,
        record: updatedRecord
      });
    } catch (error) {
      console.error("IPFS pin error:", error);
      res.status(500).json({ 
        error: "Failed to pin content on IPFS",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // IPFS storage records endpoint
  app.get("/api/ipfs/storage", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const records = await storage.getIpfsStorageByUser(req.user.id);
      
      // Add gateway URLs to each record
      const recordsWithUrls = records.map(record => ({
        ...record,
        gatewayUrl: getIPFSGatewayUrl(record.cid)
      }));

      res.json(recordsWithUrls);
    } catch (error) {
      console.error("IPFS storage records error:", error);
      res.status(500).json({ error: "Failed to fetch IPFS storage records" });
    }
  });

  // Dataset endpoints
  app.post("/api/datasets", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      // Validate dataset data
      const datasetData = insertDatasetSchema.parse({
        ...req.body,
        userId: req.user.id
      });

      // Create dataset record
      const dataset = await storage.createDataset(datasetData);

      // Create activity for dataset creation
      await storage.createActivity({
        userId: req.user.id,
        modelId: req.body.modelId || 1,
        action: "created_dataset",
        description: `Created dataset: ${dataset.name}`,
        relatedCid: dataset.dataCid
      });

      res.status(201).json(dataset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Dataset creation error:", error);
      res.status(500).json({ error: "Failed to create dataset" });
    }
  });

  app.get("/api/datasets/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const datasets = await storage.getDatasetsByUser(req.user.id);
      res.json(datasets);
    } catch (error) {
      console.error("Dataset retrieval error:", error);
      res.status(500).json({ error: "Failed to fetch datasets" });
    }
  });

  app.get("/api/datasets/:id", async (req, res) => {
    try {
      const datasetId = parseInt(req.params.id);
      const dataset = await storage.getDataset(datasetId);
      
      if (!dataset) {
        return res.status(404).json({ error: "Dataset not found" });
      }
      
      res.json({
        ...dataset,
        gatewayUrl: getIPFSGatewayUrl(dataset.dataCid)
      });
    } catch (error) {
      console.error("Dataset retrieval error:", error);
      res.status(500).json({ error: "Failed to fetch dataset" });
    }
  });

  // Environment endpoint for client configuration
  app.get("/api/environment", (req, res) => {
    res.json({
      ipfsConfigured: isIPFSConfigured()
    });
  });

  return httpServer;
}
