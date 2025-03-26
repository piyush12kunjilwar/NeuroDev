import { create } from 'ipfs-http-client';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';

// Define the IPFS node URL - we'll use Infura's hosted node for simplicity
// For production, consider using dedicated IPFS nodes or services like Pinata, Fleek, etc.
const INFURA_ID = import.meta.env.VITE_INFURA_IPFS_ID || '';
const INFURA_SECRET = import.meta.env.VITE_INFURA_IPFS_SECRET || '';
const INFURA_ENDPOINT = 'https://ipfs.infura.io:5001';

// Create authentication header
const auth = INFURA_ID && INFURA_SECRET 
  ? 'Basic ' + btoa(INFURA_ID + ':' + INFURA_SECRET) 
  : '';

/**
 * Create IPFS client with auth
 */
export const ipfsClient = () => {
  if (!INFURA_ID || !INFURA_SECRET) {
    console.warn('IPFS credentials not configured. Please set VITE_INFURA_IPFS_ID and VITE_INFURA_IPFS_SECRET environment variables.');
  }
  
  return create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
      authorization: auth,
    },
  });
};

/**
 * Upload content to IPFS
 * @param content Content to upload (string, Buffer, Blob etc.)
 * @param options Upload options
 * @returns CID of the uploaded content
 */
export const uploadToIPFS = async (content: string | Blob | Buffer, options: any = {}) => {
  try {
    const ipfs = ipfsClient();
    
    let data;
    if (typeof content === 'string') {
      data = uint8ArrayFromString(content);
    } else if (content instanceof Blob) {
      data = await content.arrayBuffer();
    } else {
      // Assume it's already in a format IPFS can handle
      data = content;
    }
    
    const result = await ipfs.add(data, options);
    return result.cid.toString();
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error(`Failed to upload to IPFS: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get content from IPFS by CID
 * @param cid Content identifier
 * @returns Content as a string
 */
export const getFromIPFS = async (cid: string): Promise<string> => {
  try {
    const ipfs = ipfsClient();
    
    let content = '';
    
    // Collect all chunks of data
    for await (const chunk of ipfs.cat(cid)) {
      content += uint8ArrayToString(chunk);
    }
    
    return content;
  } catch (error) {
    console.error('Error getting content from IPFS:', error);
    throw new Error(`Failed to get content from IPFS: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Pin content to ensure it's persistently stored
 * @param cid Content identifier to pin
 * @returns Success status
 */
export const pinToIPFS = async (cid: string): Promise<boolean> => {
  try {
    const ipfs = ipfsClient();
    await ipfs.pin.add(cid);
    return true;
  } catch (error) {
    console.error('Error pinning content to IPFS:', error);
    return false;
  }
};

/**
 * Get IPFS gateway URL for a CID
 * @param cid Content identifier
 * @returns Public gateway URL
 */
export const getIPFSGatewayUrl = (cid: string): string => {
  // Using a public gateway - consider using a dedicated gateway for production
  return `https://ipfs.io/ipfs/${cid}`;
};