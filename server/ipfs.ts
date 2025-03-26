import { create } from 'ipfs-http-client';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { log } from './vite';

// Define the IPFS node URL - we'll use Infura's hosted node for simplicity
const INFURA_ID = process.env.INFURA_IPFS_ID || '';
const INFURA_SECRET = process.env.INFURA_IPFS_SECRET || '';
const INFURA_ENDPOINT = 'https://ipfs.infura.io:5001';

// Create authentication header
const auth = INFURA_ID && INFURA_SECRET 
  ? 'Basic ' + Buffer.from(INFURA_ID + ':' + INFURA_SECRET).toString('base64') 
  : '';

// Create the IPFS client
const createIPFSClient = () => {
  if (!INFURA_ID || !INFURA_SECRET) {
    log('IPFS credentials not configured. Please set INFURA_IPFS_ID and INFURA_IPFS_SECRET environment variables.', 'ipfs');
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
 * Upload a file or content to IPFS
 * @param content Content to upload
 * @returns CID of the uploaded content
 */
export async function uploadToIPFS(content: string | Buffer): Promise<string> {
  try {
    const ipfs = createIPFSClient();
    
    let data;
    if (typeof content === 'string') {
      data = uint8ArrayFromString(content);
    } else {
      data = content;
    }
    
    const result = await ipfs.add(data);
    log(`Content uploaded to IPFS with CID: ${result.cid.toString()}`, 'ipfs');
    return result.cid.toString();
  } catch (error) {
    log(`Error uploading to IPFS: ${error}`, 'ipfs');
    throw new Error(`Failed to upload to IPFS: ${error}`);
  }
}

/**
 * Retrieve content from IPFS by CID
 * @param cid Content identifier
 * @returns Content as a string
 */
export async function getFromIPFS(cid: string): Promise<string> {
  try {
    const ipfs = createIPFSClient();
    
    let content = '';
    
    for await (const chunk of ipfs.cat(cid)) {
      content += uint8ArrayToString(chunk);
    }
    
    return content;
  } catch (error) {
    log(`Error getting content from IPFS: ${error}`, 'ipfs');
    throw new Error(`Failed to get content from IPFS: ${error}`);
  }
}

/**
 * Pin content to IPFS to ensure it's persistently stored
 * @param cid Content identifier to pin
 * @returns Success status
 */
export async function pinToIPFS(cid: string): Promise<boolean> {
  try {
    const ipfs = createIPFSClient();
    await ipfs.pin.add(cid);
    log(`Content with CID ${cid} pinned successfully`, 'ipfs');
    return true;
  } catch (error) {
    log(`Error pinning content to IPFS: ${error}`, 'ipfs');
    return false;
  }
}

/**
 * Get public gateway URL for a CID
 * @param cid Content identifier
 * @returns Public gateway URL
 */
export function getIPFSGatewayUrl(cid: string): string {
  return `https://ipfs.io/ipfs/${cid}`;
}

/**
 * Check if IPFS service is properly configured
 * @returns Configuration status
 */
export function isIPFSConfigured(): boolean {
  return Boolean(INFURA_ID && INFURA_SECRET);
}