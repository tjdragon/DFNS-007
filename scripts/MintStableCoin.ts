import { encodeFunctionData, parseUnits } from 'viem'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url';
import readline from 'readline';
import { dfnsApi, BANK_WALLET_ID, client } from './DFNSCommon';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query: string): Promise<string> {
    return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
    try {
        console.log("--- Mint StableCoin ---");

        // 1. Get Wallet Address
        const wallet = await dfnsApi.wallets.getWallet({ walletId: BANK_WALLET_ID });
        const fromAddress = wallet.address;
        console.log(`Minting from wallet address (Minter Role): ${fromAddress}`);

        // 2. Mint Arguments
        const contractAddress = await askQuestion("Enter StableCoin Contract Address: ");
        if (!contractAddress) throw new Error("Contract address is required");

        const toAddress = await askQuestion("Enter Recipient Address: ");
        if (!toAddress) throw new Error("Recipient address is required");

        const amountInput = await askQuestion("Enter Amount to Mint (assuming 6 decimals): ");
        if (!amountInput) throw new Error("Amount is required");
        const amount = parseUnits(amountInput, 6);

        rl.close();

        // 3. Read Artifact
        const artifactPath = path.join(__dirname, '../artifacts/contracts/StableCoin.sol/StableCoin.json');
        if (!fs.existsSync(artifactPath)) {
            throw new Error(`Artifact not found at ${artifactPath}. Did you run 'npx hardhat compile'?`);
        }
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        const { abi } = artifact;

        // 4. Encode Function Data
        const mintData = encodeFunctionData({
            abi,
            functionName: 'mint',
            args: [toAddress, amount],
        });

        console.log("Function data encoded.");

        // 5. Construct Transaction
        const transaction = {
            kind: "Eip1559",
            to: contractAddress,
            data: mintData,
        };

        console.log("Broadcasting transaction...");

        const result = await dfnsApi.wallets.broadcastTransaction({
            walletId: BANK_WALLET_ID,
            body: transaction as any
        });

        console.log("Transaction broadcasted successfully!");
        console.log("Transaction ID:", result.id);
        console.log("Transaction Hash:", result.txHash);

        console.log("Waiting for transaction receipt...");
        const receipt = await client.waitForTransactionReceipt({ hash: result.txHash as `0x${string}` });
        console.log("\n!!! MINT SUCCESSFUL !!!");
        console.log("Transaction Hash:", receipt.transactionHash);

    } catch (error) {
        console.error("Failed to mint:", error);
        rl.close();
        process.exit(1);
    }
}

main();
