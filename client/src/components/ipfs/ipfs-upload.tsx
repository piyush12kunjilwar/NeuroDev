import { useState, useRef } from "react";
import { useIpfs } from "@/hooks/use-ipfs";
import { ipfsContentTypeSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, File, RefreshCcw, CheckCircle, AlertCircle } from "lucide-react";

export function IpfsUpload() {
  const { uploadText, uploadFile, uploadProgress, status } = useIpfs();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [textForm, setTextForm] = useState({
    content: "",
    contentType: "code" as const,
    fileName: "",
    description: "",
  });

  const [fileForm, setFileForm] = useState({
    contentType: "data" as const,
    description: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const contentTypes = Object.values(ipfsContentTypeSchema.enum);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTextForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleContentTypeChange = (value: string, isFile = false) => {
    if (isFile) {
      setFileForm(prev => ({ ...prev, contentType: value as any }));
    } else {
      setTextForm(prev => ({ ...prev, contentType: value as any }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleTextUpload = async () => {
    if (!textForm.content) return;
    
    try {
      await uploadText({
        content: textForm.content,
        contentType: textForm.contentType,
        fileName: textForm.fileName || undefined,
        description: textForm.description || undefined
      });
      
      // Clear form after successful upload
      setTextForm({
        content: "",
        contentType: "code" as const,
        fileName: "",
        description: "",
      });
    } catch (error) {
      console.error("Failed to upload text content:", error);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    
    try {
      await uploadFile({
        file: selectedFile,
        contentType: fileForm.contentType,
        description: fileForm.description || undefined
      });
      
      // Clear form after successful upload
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setFileForm({
        contentType: "data" as const,
        description: "",
      });
    } catch (error) {
      console.error("Failed to upload file:", error);
    }
  };

  const renderUploadProgress = () => {
    if (uploadProgress.status === 'idle') return null;
    
    return (
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {uploadProgress.status === 'uploading' && 'Uploading...'}
            {uploadProgress.status === 'success' && 'Upload complete!'}
            {uploadProgress.status === 'error' && 'Upload failed'}
          </span>
          <span className="text-sm text-muted-foreground">
            {uploadProgress.progress}%
          </span>
        </div>
        <Progress value={uploadProgress.progress} className="h-2" />
        <div className="flex items-center text-sm">
          {uploadProgress.status === 'uploading' && <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />}
          {uploadProgress.status === 'success' && <CheckCircle className="h-4 w-4 mr-2 text-green-500" />}
          {uploadProgress.status === 'error' && <AlertCircle className="h-4 w-4 mr-2 text-red-500" />}
          {uploadProgress.message}
        </div>
      </div>
    );
  };

  // Check if IPFS is configured
  if (!status?.configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>IPFS Storage Not Configured</CardTitle>
          <CardDescription>
            The IPFS connection is not properly configured. Please check your environment configuration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            IPFS requires proper configuration with valid credentials. Contact the administrator to set up IPFS integration.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload to IPFS</CardTitle>
        <CardDescription>
          Share data, code, or model weights with the network by uploading to IPFS
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="text">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">Text Content</TabsTrigger>
            <TabsTrigger value="file">File Upload</TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="contentType">Content Type</Label>
              <Select 
                value={textForm.contentType} 
                onValueChange={(value) => handleContentTypeChange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fileName">File Name (Optional)</Label>
              <Input
                id="fileName"
                name="fileName"
                value={textForm.fileName}
                onChange={handleTextChange}
                placeholder="e.g., model-weights.json"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                name="description"
                value={textForm.description}
                onChange={handleTextChange}
                placeholder="Brief description of the content"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                name="content"
                value={textForm.content}
                onChange={handleTextChange}
                placeholder="Enter text content to upload"
                className="min-h-[200px]"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="file" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="fileContentType">Content Type</Label>
              <Select 
                value={fileForm.contentType} 
                onValueChange={(value) => handleContentTypeChange(value, true)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fileDescription">Description (Optional)</Label>
              <Input
                id="fileDescription"
                name="description"
                value={fileForm.description}
                onChange={handleFileFormChange}
                placeholder="Brief description of the file"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <div className="border rounded-md p-4 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="p-3 bg-primary/10 rounded-full">
                    {selectedFile ? (
                      <File className="h-8 w-8 text-primary" />
                    ) : (
                      <UploadCloud className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-medium">{selectedFile.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-medium">Click to select a file</span>
                      <span className="text-xs text-muted-foreground">
                        or drag and drop (max 50MB)
                      </span>
                    </div>
                  )}
                  <Input
                    ref={fileInputRef}
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2"
                  >
                    Select File
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {renderUploadProgress()}
      </CardContent>
      <CardFooter className="flex justify-end">
        <TabsContent value="text" className="mt-0 p-0">
          <Button 
            onClick={handleTextUpload}
            disabled={!textForm.content || uploadProgress.status === 'uploading'}
          >
            Upload Text
          </Button>
        </TabsContent>
        <TabsContent value="file" className="mt-0 p-0">
          <Button 
            onClick={handleFileUpload}
            disabled={!selectedFile || uploadProgress.status === 'uploading'}
          >
            Upload File
          </Button>
        </TabsContent>
      </CardFooter>
    </Card>
  );
}