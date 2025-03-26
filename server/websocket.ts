import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from './storage';
import { Activity, Model, Contribution } from '@shared/schema';

// Message types
type ModelUpdateMessage = {
  type: 'MODEL_UPDATE';
  data: Model;
};

type ActivityUpdateMessage = {
  type: 'ACTIVITY_UPDATE';
  data: Activity;
};

type ContributionUpdateMessage = {
  type: 'CONTRIBUTION_UPDATE';
  data: Contribution;
};

type StatsUpdateMessage = {
  type: 'STATS_UPDATE';
  data: {
    activeModels: number;
    computeContributors: number;
    pendingContributions: number;
    acceptedContributions: number;
  };
};

type UserTokensUpdateMessage = {
  type: 'USER_TOKENS_UPDATE';
  userId: number;
  tokens: number;
};

type Message = 
  | ModelUpdateMessage 
  | ActivityUpdateMessage 
  | ContributionUpdateMessage
  | StatsUpdateMessage
  | UserTokensUpdateMessage;

export class WebSocketHandler {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, { userId?: number }> = new Map();
  
  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupWebsocketServer();
  }
  
  private setupWebsocketServer() {
    this.wss.on('connection', (ws) => {
      console.log('WebSocket client connected');
      this.clients.set(ws, {});
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          // Handle authentication
          if (data.type === 'AUTHENTICATE' && data.userId) {
            const user = await storage.getUser(data.userId);
            if (user) {
              this.clients.set(ws, { userId: user.id });
              console.log(`User ${user.id} authenticated on WebSocket`);
            }
          }
          
          // Handle compute provider registration
          if (data.type === 'REGISTER_COMPUTE' && data.userId) {
            const user = await storage.getUser(data.userId);
            if (user) {
              await storage.setComputeProvider(user.id, true);
              console.log(`User ${user.id} registered as compute provider`);
              
              // Broadcast updated stats
              this.broadcastStats();
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });
      
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });
      
      // Send initial stats to the new client
      this.sendStats(ws);
    });
  }
  
  private broadcast(message: Message) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
  
  private sendToUser(userId: number, message: Message) {
    this.wss.clients.forEach((client) => {
      const clientData = this.clients.get(client);
      if (client.readyState === WebSocket.OPEN && clientData?.userId === userId) {
        client.send(JSON.stringify(message));
      }
    });
  }
  
  private async sendStats(ws: WebSocket) {
    try {
      const models = await storage.getAllModels();
      const pendingContributions = await storage.getContributionsByStatus('pending');
      const acceptedContributions = await storage.getContributionsByStatus('accepted');
      
      // Count users who are compute providers
      const users = Array.from((await Promise.all(
        Array.from({ length: this.getMaxUserId() }, (_, i) => storage.getUser(i + 1))
      )).filter(user => user !== undefined) as Array<NonNullable<Awaited<ReturnType<typeof storage.getUser>>>>);
      
      const computeProviders = users.filter(user => user.computeProvider).length;
      
      const statsMessage: StatsUpdateMessage = {
        type: 'STATS_UPDATE',
        data: {
          activeModels: models.length,
          computeContributors: computeProviders,
          pendingContributions: pendingContributions.length,
          acceptedContributions: acceptedContributions.length
        }
      };
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(statsMessage));
      }
    } catch (error) {
      console.error('Error sending stats:', error);
    }
  }
  
  private getMaxUserId(): number {
    // Find the highest user ID in the client map
    let maxId = 0;
    for (const [_, data] of this.clients.entries()) {
      if (data.userId && data.userId > maxId) {
        maxId = data.userId;
      }
    }
    return maxId;
  }
  
  // Public methods to broadcast updates
  
  public async broadcastModelUpdate(modelId: number) {
    try {
      const model = await storage.getModel(modelId);
      if (model) {
        this.broadcast({
          type: 'MODEL_UPDATE',
          data: model
        });
      }
    } catch (error) {
      console.error('Error broadcasting model update:', error);
    }
  }
  
  public async broadcastNewActivity(activity: Activity) {
    try {
      this.broadcast({
        type: 'ACTIVITY_UPDATE',
        data: activity
      });
    } catch (error) {
      console.error('Error broadcasting activity update:', error);
    }
  }
  
  public async broadcastContributionUpdate(contribution: Contribution) {
    try {
      this.broadcast({
        type: 'CONTRIBUTION_UPDATE',
        data: contribution
      });
      
      // Also update stats after a contribution update
      this.broadcastStats();
    } catch (error) {
      console.error('Error broadcasting contribution update:', error);
    }
  }
  
  public async broadcastStats() {
    try {
      const models = await storage.getAllModels();
      const pendingContributions = await storage.getContributionsByStatus('pending');
      const acceptedContributions = await storage.getContributionsByStatus('accepted');
      
      // Count users who are compute providers
      const users = Array.from((await Promise.all(
        Array.from({ length: this.getMaxUserId() }, (_, i) => storage.getUser(i + 1))
      )).filter(user => user !== undefined) as Array<NonNullable<Awaited<ReturnType<typeof storage.getUser>>>>);
      
      const computeProviders = users.filter(user => user.computeProvider).length;
      
      this.broadcast({
        type: 'STATS_UPDATE',
        data: {
          activeModels: models.length,
          computeContributors: computeProviders,
          pendingContributions: pendingContributions.length,
          acceptedContributions: acceptedContributions.length
        }
      });
    } catch (error) {
      console.error('Error broadcasting stats:', error);
    }
  }
  
  public async notifyUserTokenUpdate(userId: number) {
    try {
      const user = await storage.getUser(userId);
      if (user) {
        this.sendToUser(userId, {
          type: 'USER_TOKENS_UPDATE',
          userId: userId,
          tokens: user.tokens
        });
      }
    } catch (error) {
      console.error('Error notifying user token update:', error);
    }
  }
}
