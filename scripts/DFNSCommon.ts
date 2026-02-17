import { DfnsApiClient } from '@dfns/sdk'
import { AsymmetricKeySigner } from '@dfns/sdk-keysigner'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from scripts directory
dotenv.config({ path: path.join(__dirname, '.env') })

if (!process.env.DFNS_CRED_ID) {
    throw new Error("DFNS_CRED_ID not found in .env");
}

const signer = new AsymmetricKeySigner({
    credId: process.env.DFNS_CRED_ID!,
    privateKey: process.env.DFNS_PRIVATE_KEY!,
})

export const dfnsApi = new DfnsApiClient({
    orgId: process.env.DFNS_ORG_ID!,
    authToken: process.env.DFNS_AUTH_TOKEN!,
    baseUrl: process.env.DFNS_API_URL!,
    signer,
})

// Wallet ID to use for deployment and owner
export const BANK_WALLET_ID = "wa-01jfg-blq4o-e2goi75iorinhv3q";

// Public Client for reading from chain
export const client = createPublicClient({
    chain: sepolia,
    transport: http(),
})

export const SENDER_WALLET_ID = "wa-01jh6-h40vk-eoq9u6gnnbl525ke";
