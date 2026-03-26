import { encodeFunctionData } from 'viem'
import { dfnsApi, SENDER_WALLET_ID, client } from './DFNSCommon';

const SCHEMA_REGISTRY_ADDRESS = '0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0';

const schemaRegistryAbi = [
    {
        name: 'register',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'schema', type: 'string' },
            { name: 'resolver', type: 'address' },
            { name: 'revocable', type: 'bool' }
        ],
        outputs: [{ name: '', type: 'bytes32' }]
    }
] as const;

async function main() {
    try {
        console.log("--- EAS Schema Registration ---");
        
        const schema = "address bond, string isin";
        const resolver = "0x0000000000000000000000000000000000000000";
        const revocable = true;

        console.log(`Registering schema: "${schema}"`);
        console.log(`Resolver: ${resolver}`);
        console.log(`Revocable: ${revocable}`);

        const data = encodeFunctionData({
            abi: schemaRegistryAbi,
            functionName: 'register',
            args: [schema, resolver, revocable]
        });

        const transaction = {
            kind: "Eip1559",
            to: SCHEMA_REGISTRY_ADDRESS,
            data: data,
        };

        console.log(`Broadcasting transaction from wallet ${SENDER_WALLET_ID}...`);

        const result = await dfnsApi.wallets.broadcastTransaction({
            walletId: SENDER_WALLET_ID,
            body: transaction as any
        });

        if (result.txHash) {
            console.log("Transaction Hash:", result.txHash);
            console.log("Waiting for transaction receipt...");
            const receipt = await client.waitForTransactionReceipt({ hash: result.txHash as `0x${string}` });
            console.log("Transaction confirmed in block:", receipt.blockNumber);
            console.log("See Tx on Sepolia:", `https://sepolia.etherscan.io/tx/${result.txHash}`);
        } else {
            console.log("Transaction pending or requiring approval. ID:", result.id);
        }

    } catch (error) {
        console.error("Failed to register schema:", error);
        process.exit(1);
    }
}

main();
