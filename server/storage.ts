import { 
  users, type User, type InsertUser,
  contributions, type Contribution, type InsertContribution,
  models, type Model, type InsertModel,
  activities, type Activity, type InsertActivity,
  ipfsStorage, type IpfsStorage, type InsertIpfsStorage,
  datasets, type Dataset, type InsertDataset
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { SessionStore } from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User-related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTokens(userId: number, tokens: number): Promise<User | undefined>;
  setComputeProvider(userId: number, isProvider: boolean): Promise<User | undefined>;
  updateUserProfile(userId: number, profileImageCid: string): Promise<User | undefined>;
  
  // Contribution-related methods
  getContribution(id: number): Promise<Contribution | undefined>;
  getContributionsByUser(userId: number): Promise<Contribution[]>;
  getContributionsByModel(modelId: number): Promise<Contribution[]>;
  getContributionsByStatus(status: string): Promise<Contribution[]>;
  createContribution(contribution: InsertContribution): Promise<Contribution>;
  updateContributionStatus(id: number, status: string, reward?: number): Promise<Contribution | undefined>;
  
  // Model-related methods
  getModel(id: number): Promise<Model | undefined>;
  getAllModels(): Promise<Model[]>;
  createModel(model: InsertModel): Promise<Model>;
  updateModel(id: number, updatedModel: Partial<Model>): Promise<Model | undefined>;
  updateModelCode(modelId: number, code: string, codeCid: string): Promise<Model | undefined>;
  updateModelWeights(modelId: number, weightsCid: string): Promise<Model | undefined>;
  
  // Activity-related methods
  getActivities(modelId: number, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // IPFS storage methods
  getIpfsStorage(id: number): Promise<IpfsStorage | undefined>;
  getIpfsStorageByCid(cid: string): Promise<IpfsStorage | undefined>;
  getIpfsStorageByUser(userId: number): Promise<IpfsStorage[]>;
  createIpfsStorage(storage: InsertIpfsStorage): Promise<IpfsStorage>;
  updateIpfsStoragePinStatus(cid: string, pinned: boolean): Promise<IpfsStorage | undefined>;
  
  // Dataset methods
  getDataset(id: number): Promise<Dataset | undefined>;
  getDatasetsByUser(userId: number): Promise<Dataset[]>;
  createDataset(dataset: InsertDataset): Promise<Dataset>;
  
  // Session store
  sessionStore: SessionStore;
}

export class MemStorage implements IStorage {
  private _users: Map<number, User>;
  private _contributions: Map<number, Contribution>;
  private _models: Map<number, Model>;
  private _activities: Map<number, Activity>;
  private _ipfsStorage: Map<number, IpfsStorage>;
  private _datasets: Map<number, Dataset>;
  sessionStore: SessionStore;
  
  private _userIdCounter: number;
  private _contributionIdCounter: number;
  private _modelIdCounter: number;
  private _activityIdCounter: number;
  private _ipfsStorageIdCounter: number;
  private _datasetIdCounter: number;
  
  constructor() {
    this._users = new Map();
    this._contributions = new Map();
    this._models = new Map();
    this._activities = new Map();
    this._ipfsStorage = new Map();
    this._datasets = new Map();
    
    this._userIdCounter = 1;
    this._contributionIdCounter = 1;
    this._modelIdCounter = 1;
    this._activityIdCounter = 1;
    this._ipfsStorageIdCounter = 1;
    this._datasetIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Create initial MNIST classifier model
    const initialModel: InsertModel = {
      name: "MNIST Classifier",
      description: "A convolutional neural network for classifying handwritten digits.",
      architecture: "Convolutional Neural Network",
      code: `import torch
import torch.nn as nn
import torch.nn.functional as F

class MNISTClassifier(nn.Module):
    def __init__(self):
        super(MNISTClassifier, self).__init__()
        self.conv1 = nn.Conv2d(1, 32, 3, 1)
        self.conv2 = nn.Conv2d(32, 64, 3, 1)
        self.dropout1 = nn.Dropout2d(0.25)
        self.dropout2 = nn.Dropout2d(0.5)
        self.fc1 = nn.Linear(9216, 128)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = self.conv1(x)
        x = F.relu(x)
        x = self.conv2(x)
        x = F.relu(x)
        x = F.max_pool2d(x, 2)
        x = self.dropout1(x)
        x = torch.flatten(x, 1)
        x = self.fc1(x)
        x = F.relu(x)
        x = self.dropout2(x)
        x = self.fc2(x)
        output = F.log_softmax(x, dim=1)
        return output

def train(model, device, train_loader, optimizer, epoch):
    model.train()
    for batch_idx, (data, target) in enumerate(train_loader):
        data, target = data.to(device), target.to(device)
        optimizer.zero_grad()
        output = model(data)
        loss = F.nll_loss(output, target)
        loss.backward()
        optimizer.step()
        if batch_idx % 10 == 0:
            print('Train Epoch: {} [{}/{} ({:.0f}%)]\tLoss: {:.6f}'.format(
                epoch, batch_idx * len(data), len(train_loader.dataset),
                100. * batch_idx / len(train_loader), loss.item()))`,
      currentAccuracy: "96.8%",
      previousAccuracy: "94.4%",
      parameters: "1.28M",
    };
    
    this.createModel(initialModel);
  }
  
  // User-related methods
  async getUser(id: number): Promise<User | undefined> {
    return this._users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this._users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this._userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id, 
      tokens: 0, 
      computeProvider: false,
      profileImageCid: null
    };
    this._users.set(id, user);
    return user;
  }
  
  async updateUserTokens(userId: number, tokens: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, tokens: user.tokens + tokens };
    this._users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async setComputeProvider(userId: number, isProvider: boolean): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, computeProvider: isProvider };
    this._users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserProfile(userId: number, profileImageCid: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, profileImageCid };
    this._users.set(userId, updatedUser);
    return updatedUser;
  }
  
  // Contribution-related methods
  async getContribution(id: number): Promise<Contribution | undefined> {
    return this._contributions.get(id);
  }
  
  async getContributionsByUser(userId: number): Promise<Contribution[]> {
    return Array.from(this._contributions.values()).filter(
      (contribution) => contribution.userId === userId
    );
  }
  
  async getContributionsByModel(modelId: number): Promise<Contribution[]> {
    return Array.from(this._contributions.values()).filter(
      (contribution) => contribution.modelId === modelId
    );
  }
  
  async getContributionsByStatus(status: string): Promise<Contribution[]> {
    return Array.from(this._contributions.values()).filter(
      (contribution) => contribution.status === status
    );
  }
  
  async createContribution(insertContribution: InsertContribution): Promise<Contribution> {
    const id = this._contributionIdCounter++;
    const timestamp = new Date();
    const contribution: Contribution = { 
      ...insertContribution, 
      id, 
      status: "pending", 
      timestamp,
      reward: null,
      code: insertContribution.code || null,
      dataCid: insertContribution.dataCid || null,
      codeCid: insertContribution.codeCid || null
    };
    
    this._contributions.set(id, contribution);
    return contribution;
  }
  
  async updateContributionStatus(id: number, status: string, reward?: number): Promise<Contribution | undefined> {
    const contribution = await this.getContribution(id);
    if (!contribution) return undefined;
    
    const updatedContribution: Contribution = { 
      ...contribution, 
      status,
      reward: reward !== undefined ? reward : contribution.reward
    };
    
    this._contributions.set(id, updatedContribution);
    
    // If accepted, update user tokens
    if (status === "accepted" && reward !== undefined) {
      await this.updateUserTokens(contribution.userId, reward);
    }
    
    return updatedContribution;
  }
  
  // Model-related methods
  async getModel(id: number): Promise<Model | undefined> {
    return this._models.get(id);
  }
  
  async getAllModels(): Promise<Model[]> {
    return Array.from(this._models.values());
  }
  
  async createModel(insertModel: InsertModel): Promise<Model> {
    const id = this._modelIdCounter++;
    const lastUpdated = new Date();
    const model: Model = { 
      ...insertModel, 
      id, 
      lastUpdated,
      codeCid: insertModel.codeCid || null,
      weightsCid: insertModel.weightsCid || null,
      previousAccuracy: insertModel.previousAccuracy || null
    };
    
    this._models.set(id, model);
    return model;
  }
  
  async updateModel(id: number, updatedModel: Partial<Model>): Promise<Model | undefined> {
    const model = await this.getModel(id);
    if (!model) return undefined;
    
    const newModel: Model = { 
      ...model, 
      ...updatedModel,
      lastUpdated: new Date()
    };
    
    this._models.set(id, newModel);
    return newModel;
  }
  
  async updateModelCode(modelId: number, code: string, codeCid: string): Promise<Model | undefined> {
    const model = await this.getModel(modelId);
    if (!model) return undefined;
    
    const updatedModel: Model = {
      ...model,
      code,
      codeCid,
      lastUpdated: new Date()
    };
    
    this._models.set(modelId, updatedModel);
    return updatedModel;
  }
  
  async updateModelWeights(modelId: number, weightsCid: string): Promise<Model | undefined> {
    const model = await this.getModel(modelId);
    if (!model) return undefined;
    
    const updatedModel: Model = {
      ...model,
      weightsCid,
      lastUpdated: new Date()
    };
    
    this._models.set(modelId, updatedModel);
    return updatedModel;
  }
  
  // Activity-related methods
  async getActivities(modelId: number, limit?: number): Promise<Activity[]> {
    const activities = Array.from(this._activities.values())
      .filter((activity) => activity.modelId === modelId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? activities.slice(0, limit) : activities;
  }
  
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this._activityIdCounter++;
    const timestamp = new Date();
    const activity: Activity = { 
      ...insertActivity, 
      id, 
      timestamp,
      metadata: insertActivity.metadata || {},
      userId: insertActivity.userId || null,
      relatedCid: insertActivity.relatedCid || null
    };
    
    this._activities.set(id, activity);
    return activity;
  }
  
  // IPFS Storage methods
  async getIpfsStorage(id: number): Promise<IpfsStorage | undefined> {
    return this._ipfsStorage.get(id);
  }
  
  async getIpfsStorageByCid(cid: string): Promise<IpfsStorage | undefined> {
    return Array.from(this._ipfsStorage.values()).find(
      (storage) => storage.cid === cid
    );
  }
  
  async getIpfsStorageByUser(userId: number): Promise<IpfsStorage[]> {
    return Array.from(this._ipfsStorage.values()).filter(
      (storage) => storage.userId === userId
    );
  }
  
  async createIpfsStorage(storage: InsertIpfsStorage): Promise<IpfsStorage> {
    const id = this._ipfsStorageIdCounter++;
    const createdAt = new Date();
    
    const ipfsStorage: IpfsStorage = {
      ...storage,
      id,
      createdAt,
      pinned: false
    };
    
    this._ipfsStorage.set(id, ipfsStorage);
    return ipfsStorage;
  }
  
  async updateIpfsStoragePinStatus(cid: string, pinned: boolean): Promise<IpfsStorage | undefined> {
    const storage = await this.getIpfsStorageByCid(cid);
    if (!storage) return undefined;
    
    const updatedStorage: IpfsStorage = {
      ...storage,
      pinned
    };
    
    this._ipfsStorage.set(storage.id, updatedStorage);
    return updatedStorage;
  }
  
  // Dataset methods
  async getDataset(id: number): Promise<Dataset | undefined> {
    return this._datasets.get(id);
  }
  
  async getDatasetsByUser(userId: number): Promise<Dataset[]> {
    return Array.from(this._datasets.values()).filter(
      (dataset) => dataset.userId === userId
    );
  }
  
  async createDataset(dataset: InsertDataset): Promise<Dataset> {
    const id = this._datasetIdCounter++;
    const createdAt = new Date();
    
    const newDataset: Dataset = {
      ...dataset,
      id,
      createdAt
    };
    
    this._datasets.set(id, newDataset);
    return newDataset;
  }
}

export const storage = new MemStorage();
