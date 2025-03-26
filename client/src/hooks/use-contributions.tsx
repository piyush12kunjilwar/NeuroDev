import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Contribution, ContributionType, InsertContribution } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface ContributionFormData {
  type: ContributionType;
  description: string;
  code?: string;
  modelId: number;
}

type ContributionsContextType = {
  userContributions: Contribution[];
  communityContributions: Contribution[];
  isLoading: boolean;
  submitContribution: (data: ContributionFormData) => Promise<void>;
  isSubmitting: boolean;
};

const ContributionsContext = createContext<ContributionsContextType | null>(null);

const contributionFormSchema = z.object({
  type: z.enum(["code", "compute", "data", "hyperparameters"]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  code: z.string().optional(),
  modelId: z.number(),
});

export function ContributionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user's contributions
  const { 
    data: userContributions = [], 
    isLoading: isUserContributionsLoading 
  } = useQuery<Contribution[]>({
    queryKey: ["/api/contributions/user"],
    enabled: !!user,
  });

  // Fetch community contributions
  const { 
    data: communityContributions = [], 
    isLoading: isCommunityContributionsLoading 
  } = useQuery<Contribution[]>({
    queryKey: ["/api/contributions"],
    queryFn: async () => {
      const res = await fetch("/api/contributions?modelId=1");
      if (!res.ok) throw new Error("Failed to fetch community contributions");
      return res.json();
    },
    enabled: !!user,
  });

  // Submit contribution mutation
  const submitContributionMutation = useMutation({
    mutationFn: async (data: ContributionFormData) => {
      try {
        // Validate form data
        contributionFormSchema.parse(data);
        
        // Create contribution
        const contributionData: Partial<InsertContribution> = {
          modelId: data.modelId,
          type: data.type,
          description: data.description,
        };
        
        if (data.code) {
          contributionData.code = data.code;
        }
        
        await apiRequest("POST", "/api/contributions", contributionData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(error.errors[0].message);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contributions/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contributions"] });
      
      toast({
        title: "Contribution submitted",
        description: "Your contribution has been successfully submitted for review.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitContribution = async (data: ContributionFormData) => {
    await submitContributionMutation.mutateAsync(data);
  };

  return (
    <ContributionsContext.Provider
      value={{
        userContributions,
        communityContributions,
        isLoading: isUserContributionsLoading || isCommunityContributionsLoading,
        submitContribution,
        isSubmitting: submitContributionMutation.isPending,
      }}
    >
      {children}
    </ContributionsContext.Provider>
  );
}

export function useContributions() {
  const context = useContext(ContributionsContext);
  if (!context) {
    throw new Error("useContributions must be used within a ContributionsProvider");
  }
  return context;
}
