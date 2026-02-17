import { encodeDeployData, parseUnits, getContractAddress, encodeFunctionData } from 'viem'
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
        console.log("--- Deploy Bond ---");

        // 1. Get Wallet Address
        const wallet = await dfnsApi.wallets.getWallet({ walletId: BANK_WALLET_ID });
        const walletAddress = wallet.address;
        console.log(`Deploying from wallet address: ${walletAddress}`);

        // 2. Deployment Arguments
        const name = await askQuestion("Enter Bond Name (default: Corporate Bond): ") || "Corporate Bond";
        const symbol = await askQuestion("Enter Bond Symbol (default: CB): ") || "CB";
        const currencyAddress = await askQuestion("Enter Currency Address (StableCoin): ");
        if (!currencyAddress) throw new Error("Currency address is required");

        const notionalInput = await askQuestion("Enter Notional Amount (default: 100): ") || "100";
        const notional = parseUnits(notionalInput, 0); // Assuming 0 decimals for StableCoin

        const aprInput = await askQuestion("Enter APR in basis points (default: 400 = 4%): ") || "400";
        const apr = BigInt(aprInput);

        const frequencyInput = await askQuestion("Enter Coupon Frequency in seconds (default: 3 months = 7776000): ") || "7776000";
        const frequency = BigInt(frequencyInput);

        const durationInput = await askQuestion("Enter Duration in seconds to add to now for maturity (default: 1 year = 31536000): ") || "31536000";
        const currentBlock = await client.getBlock();
        const maturityDate = currentBlock.timestamp + BigInt(durationInput);

        rl.close();

        // 3. Read Artifact
        const artifactPath = path.join(__dirname, '../artifacts/contracts/Bond.sol/Bond.json');
        if (!fs.existsSync(artifactPath)) {
            throw new Error(`Artifact not found at ${artifactPath}. Did you run 'npx hardhat compile'?`);
        }
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        const { abi, bytecode } = artifact;

        // 4. Pre-Approve Transfer
        console.log("Pre-approving Principal Transfer...");
        const nonce = await client.getTransactionCount({ address: walletAddress as `0x${string}` });
        const futureAddress = await getContractAddress({ from: walletAddress as `0x${string}`, nonce: BigInt(nonce) + 1n }); // +1 because approve is next tx

        console.log(`Computed Future Bond Address: ${futureAddress}`);

        // Approve Notional
        // We need Currency ABI
        const currencyArtifactPath = path.join(__dirname, '../artifacts/contracts/StableCoin.sol/StableCoin.json');
        const currencyArtifact = JSON.parse(fs.readFileSync(currencyArtifactPath, 'utf8'));

        const approveData = encodeFunctionData({
            abi: currencyArtifact.abi,
            functionName: 'approve',
            args: [futureAddress, notional]
        });

        const approveTx = {
            kind: "Eip1559",
            to: currencyAddress,
            data: approveData
        };

        const approveResult = await dfnsApi.wallets.broadcastTransaction({
            walletId: BANK_WALLET_ID,
            body: approveTx as any
        });

        console.log(`Approval Broadcasted: ${approveResult.txHash}`);
        await client.waitForTransactionReceipt({ hash: approveResult.txHash as `0x${string}` });
        console.log("Approval Confirmed.");

        // 5. Encode Deployment Data
        const deployData = encodeDeployData({
            abi,
            bytecode,
            args: [name, symbol, currencyAddress, notional, apr, frequency, maturityDate],
        });

        console.log("Deployment data encoded.");

        // 6. Construct Transaction
        const transaction = {
            kind: "Eip1559",
            to: undefined,
            data: deployData,
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
        console.log("\n!!! DEPLOYMENT SUCCESSFUL !!!");
        console.log("Contract deployed at:", receipt.contractAddress);

    } catch (error) {
        console.error("Failed to deploy:", error);
        rl.close();
        process.exit(1);
    }
}

main();
