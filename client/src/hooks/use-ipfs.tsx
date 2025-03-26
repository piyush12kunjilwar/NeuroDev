import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { IpfsStorage, Dataset, IpfsContentType } from "@shared/schema";

type IpfsUploadProgress = {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  message?: string;
};

type IpfsStatus = {
  configured: boolean;
  ready: boolean;
};

type UploadTextOptions = {
  content: string;
  contentType: IpfsContentType;
  fileName?: string;
  description?: string;
  modelId?: number;
};

type UploadFileOptions = {
  file: File;
  contentType: IpfsContentType;
  description?: string;
  modelId?: number;
};

type IpfsStorageWithUrl = IpfsStorage & {
  gatewayUrl: string;
};

type DatasetWithUrl = Dataset & {
  gatewayUrl: string;
};

type IpfsContextType = {
  status: IpfsStatus | undefined;
  isStatusLoading: boolean;
  ipfsStorage: IpfsStorageWithUrl[] | undefined;
  isStorageLoading: boolean;
  datasets: Dataset[] | undefined;
  isDatasetsLoading: boolean;
  uploadText: (options: UploadTextOptions) => Promise<IpfsStorageWithUrl>;
  uploadFile: (options: UploadFileOptions) => Promise<IpfsStorageWithUrl>;
  pinContent: (cid: string) => Promise<void>;
  createDataset: (data: {
    name: string;
    description: string;
    dataCid: string;
    format: string;
    sizeBytes?: number;
  }) => Promise<Dataset>;
  uploadProgress: IpfsUploadProgress;
};

const defaultUploadProgress: IpfsUploadProgress = {
  status: 'idle',
  progress: 0,
};

export const IpfsContext = createContext<IpfsContextType | null>(null);

export function IpfsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState<IpfsUploadProgress>(defaultUploadProgress);

  // Get IPFS status
  const {
    data: status,
    isLoading: isStatusLoading,
  } = useQuery<IpfsStatus>({
    queryKey: ['/api/ipfs/status'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: true,
  });

  // Get user's IPFS storage records
  const {
    data: ipfsStorage,
    isLoading: isStorageLoading,
  } = useQuery<IpfsStorageWithUrl[]>({
    queryKey: ['/api/ipfs/storage'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!user,
  });

  // Get user's datasets
  const {
    data: datasets,
    isLoading: isDatasetsLoading,
  } = useQuery<Dataset[]>({
    queryKey: ['/api/datasets/user'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!user,
  });

  // Upload text content to IPFS
  const uploadText = useCallback(async (options: UploadTextOptions): Promise<IpfsStorageWithUrl> => {
    if (!status?.configured) {
      throw new Error('IPFS is not configured');
    }

    try {
      setUploadProgress({
        status: 'uploading',
        progress: 10,
        message: 'Preparing upload...',
      });

      const response = await apiRequest('POST', '/api/ipfs/upload/text', options);
      
      setUploadProgress({
        status: 'uploading',
        progress: 90,
        message: 'Finalizing upload...',
      });

      const result = await response.json();

      setUploadProgress({
        status: 'success',
        progress: 100,
        message: 'Upload complete!',
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/ipfs/storage'] });

      return result;
    } catch (error) {
      setUploadProgress({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Failed to upload to IPFS',
      });
      throw error;
    } finally {
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(defaultUploadProgress);
      }, 3000);
    }
  }, [status]);

  // Upload file to IPFS
  const uploadFile = useCallback(async (options: UploadFileOptions): Promise<IpfsStorageWithUrl> => {
    if (!status?.configured) {
      throw new Error('IPFS is not configured');
    }

    try {
      setUploadProgress({
        status: 'uploading',
        progress: 10,
        message: 'Preparing file...',
      });

      const formData = new FormData();
      formData.append('file', options.file);
      formData.append('contentType', options.contentType);
      
      if (options.description) {
        formData.append('description', options.description);
      }
      
      if (options.modelId) {
        formData.append('modelId', options.modelId.toString());
      }

      setUploadProgress({
        status: 'uploading',
        progress: 30,
        message: 'Uploading to IPFS...',
      });

      const response = await fetch('/api/ipfs/upload/file', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file');
      }

      setUploadProgress({
        status: 'uploading',
        progress: 90,
        message: 'Finalizing upload...',
      });

      const result = await response.json();

      setUploadProgress({
        status: 'success',
        progress: 100,
        message: 'Upload complete!',
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/ipfs/storage'] });

      return result;
    } catch (error) {
      setUploadProgress({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Failed to upload file to IPFS',
      });
      throw error;
    } finally {
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(defaultUploadProgress);
      }, 3000);
    }
  }, [status]);

  // Pin content mutation
  const pinMutation = useMutation({
    mutationFn: async (cid: string) => {
      const response = await apiRequest('POST', `/api/ipfs/pin/${cid}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ipfs/storage'] });
      toast({
        title: 'Content pinned',
        description: 'The content has been successfully pinned to IPFS',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to pin content',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create dataset mutation
  const datasetMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      dataCid: string;
      format: string;
      sizeBytes?: number;
    }) => {
      const response = await apiRequest('POST', '/api/datasets', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/datasets/user'] });
      toast({
        title: 'Dataset created',
        description: 'Your dataset has been successfully created',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create dataset',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const pinContent = async (cid: string) => {
    await pinMutation.mutateAsync(cid);
  };

  const createDataset = async (data: {
    name: string;
    description: string;
    dataCid: string;
    format: string;
    sizeBytes?: number;
  }) => {
    return await datasetMutation.mutateAsync(data);
  };

  return (
    <IpfsContext.Provider
      value={{
        status,
        isStatusLoading,
        ipfsStorage,
        isStorageLoading,
        datasets,
        isDatasetsLoading,
        uploadText,
        uploadFile,
        pinContent,
        createDataset,
        uploadProgress,
      }}
    >
      {children}
    </IpfsContext.Provider>
  );
}

export function useIpfs() {
  const context = useContext(IpfsContext);
  if (!context) {
    throw new Error('useIpfs must be used within an IpfsProvider');
  }
  return context;
}