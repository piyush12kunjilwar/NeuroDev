import { useState } from "react";
import { useIpfs } from "@/hooks/use-ipfs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Code,
  Database,
  Download,
  ExternalLink,
  FileText,
  Image,
  Loader2,
  Pin,
  Weight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const getContentTypeIcon = (contentType: string) => {
  switch (contentType) {
    case "code":
      return <Code className="h-4 w-4" />;
    case "data":
      return <Database className="h-4 w-4" />;
    case "weights":
      return <Weight className="h-4 w-4" />;
    case "model":
      return <FileText className="h-4 w-4" />;
    case "image":
      return <Image className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

export function IpfsFiles() {
  const { ipfsStorage, isStorageLoading, datasets, isDatasetsLoading, pinContent } = useIpfs();
  const [pinningCid, setPinningCid] = useState<string | null>(null);

  const handlePinContent = async (cid: string) => {
    setPinningCid(cid);
    try {
      await pinContent(cid);
    } finally {
      setPinningCid(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const formatFileSize = (bytes?: number | null) => {
    if (bytes === undefined || bytes === null) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isStorageLoading || isDatasetsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>IPFS Files</CardTitle>
          <CardDescription>Your files stored on IPFS</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading your files...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!ipfsStorage?.length && !datasets?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>IPFS Files</CardTitle>
          <CardDescription>Your files stored on IPFS</CardDescription>
        </CardHeader>
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center gap-2">
            <FileText className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-medium">No files found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              You haven't uploaded any files to IPFS yet. Use the upload tool to store your files in a decentralized way.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>IPFS Files</CardTitle>
        <CardDescription>Your files stored on IPFS</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Name/Description</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ipfsStorage?.map((file) => (
              <TableRow key={file.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getContentTypeIcon(file.contentType)}
                    <span className="capitalize">{file.contentType}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {file.fileName || file.description || file.cid.substring(0, 10) + "..."}
                </TableCell>
                <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                <TableCell>{formatDate(file.createdAt)}</TableCell>
                <TableCell>
                  {file.pinned ? (
                    <Badge variant="outline" className="border-green-500 text-green-500">
                      <Pin className="h-3 w-3 mr-1" /> Pinned
                    </Badge>
                  ) : (
                    <Badge variant="outline">Unpinned</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" asChild>
                      <a href={file.gatewayUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button size="icon" variant="outline" asChild>
                      <a href={`/api/ipfs/content/${file.cid}`} download={file.fileName || file.cid}>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    {!file.pinned && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handlePinContent(file.cid)}
                        disabled={pinningCid === file.cid}
                      >
                        {pinningCid === file.cid ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Pin className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            
            {datasets?.map((dataset) => (
              <TableRow key={`dataset-${dataset.id}`}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span>Dataset</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {dataset.name}
                  {dataset.description && (
                    <p className="text-xs text-muted-foreground">{dataset.description}</p>
                  )}
                </TableCell>
                <TableCell>{formatFileSize(dataset.sizeBytes)}</TableCell>
                <TableCell>{formatDate(dataset.createdAt)}</TableCell>
                <TableCell>
                  <Badge>{dataset.format}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" asChild>
                      <a href={getIPFSGatewayUrl(dataset.dataCid)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button size="icon" variant="outline" asChild>
                      <a href={`/api/ipfs/content/${dataset.dataCid}`} download={`${dataset.name}.${dataset.format}`}>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Helper function to get IPFS gateway URL
function getIPFSGatewayUrl(cid: string): string {
  return `https://ipfs.io/ipfs/${cid}`;
}