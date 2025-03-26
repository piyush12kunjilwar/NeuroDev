import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Model, Activity, Contribution } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./use-auth";

type ModelContextType = {
  currentModel: Model | null;
  activities: Activity[];
  contributions: Contribution[];
  isLoading: boolean;
  applyContribution: (contributionId: number) => Promise<void>;
  submitCompute: () => Promise<void>;
  isComputeRunning: boolean;
};

const ModelContext = createContext<ModelContextType | null>(null);

export function ModelProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [isComputeRunning, setIsComputeRunning] = useState(false);

  // Fetch the MNIST model (id: 1)
  const { 
    data: currentModel, 
    isLoading: isModelLoading 
  } = useQuery<Model>({
    queryKey: ["/api/models/1"],
    enabled: !!user,
  });

  // Fetch activities for the model
  const { 
    data: activities = [], 
    isLoading: isActivitiesLoading 
  } = useQuery<Activity[]>({
    queryKey: ["/api/activities/1"],
    enabled: !!user,
  });

  // Fetch contributions for the model
  const { 
    data: contributions = [], 
    isLoading: isContributionsLoading 
  } = useQuery<Contribution[]>({
    queryKey: ["/api/contributions"],
    queryFn: async () => {
      const res = await fetch("/api/contributions?modelId=1");
      if (!res.ok) throw new Error("Failed to fetch contributions");
      return res.json();
    },
    enabled: !!user,
  });

  // Apply contribution mutation
  const applyContributionMutation = useMutation({
    mutationFn: async (contributionId: number) => {
      await apiRequest("POST", `/api/contributions/${contributionId}/apply`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/models/1"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities/1"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contributions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Contribution applied",
        description: "The contribution has been successfully applied to the model.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to apply contribution",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Contribute compute resources mutation
  const contributeComputeMutation = useMutation({
    mutationFn: async () => {
      setIsComputeRunning(true);
      return apiRequest("POST", "/api/compute/contribute", { modelId: 1 });
    },
    onSuccess: async (res) => {
      const result = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/models/1"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities/1"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Compute contribution successful",
        description: `Your compute resources helped improve the model by ${result.improvement}. You earned ${result.reward} NXS tokens.`,
      });
      setIsComputeRunning(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Compute contribution failed",
        description: error.message,
        variant: "destructive",
      });
      setIsComputeRunning(false);
    },
  });

  // Setup WebSocket connection
  useEffect(() => {
    if (!user) return;
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log("WebSocket connected");
      // Authenticate the socket connection
      socket.send(JSON.stringify({ type: "AUTHENTICATE", userId: user.id }));
    };
    
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case "MODEL_UPDATE":
            queryClient.invalidateQueries({ queryKey: ["/api/models/1"] });
            break;
          case "ACTIVITY_UPDATE":
            queryClient.invalidateQueries({ queryKey: ["/api/activities/1"] });
            break;
          case "CONTRIBUTION_UPDATE":
            queryClient.invalidateQueries({ queryKey: ["/api/contributions"] });
            break;
          case "USER_TOKENS_UPDATE":
            if (message.userId === user.id) {
              queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            }
            break;
          default:
            break;
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };
    
    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };
    
    setWebsocket(socket);
    
    return () => {
      socket.close();
    };
  }, [user]);

  // Register as compute provider
  const registerAsComputeProvider = async () => {
    if (!user) return;
    
    try {
      await apiRequest("POST", "/api/compute/register");
      
      // Notify via WebSocket
      if (websocket?.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
          type: "REGISTER_COMPUTE",
          userId: user.id
        }));
      }
      
      toast({
        title: "Successfully registered",
        description: "You are now registered as a compute resource provider."
      });
    } catch (error) {
      console.error("Failed to register as compute provider:", error);
      toast({
        title: "Registration failed",
        description: "Failed to register as a compute resource provider.",
        variant: "destructive"
      });
    }
  };

  // Apply contribution function
  const applyContribution = async (contributionId: number) => {
    applyContributionMutation.mutate(contributionId);
  };

  // Submit compute resources function
  const submitCompute = async () => {
    if (!user) return;
    
    // If not registered as a compute provider, register first
    if (user.computeProvider === false) {
      await registerAsComputeProvider();
    }
    
    // Contribute compute
    contributeComputeMutation.mutate();
  };

  return (
    <ModelContext.Provider
      value={{
        currentModel: currentModel || null,
        activities,
        contributions,
        isLoading: isModelLoading || isActivitiesLoading || isContributionsLoading,
        applyContribution,
        submitCompute,
        isComputeRunning,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error("useModel must be used within a ModelProvider");
  }
  return context;
}
