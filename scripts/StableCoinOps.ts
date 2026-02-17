import { encodeFunctionData, parseUnits, formatUnits } from 'viem'
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

let currencyAbi: any;
let currencyAddress: string;

async function getContractABI(name: string) {
    const artifactPath = path.join(__dirname, `../artifacts/contracts/${name}.sol/${name}.json`);
    if (!fs.existsSync(artifactPath)) {
        throw new Error(`Artifact not found at ${artifactPath}`);
    }
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    return artifact.abi;
}

async function viewFunctions() {
    console.log('\n--- View Functions ---');
    try {
        const totalMinted = await client.readContract({
            address: currencyAddress as `0x${string}`,
            abi: currencyAbi,
            functionName: 'totalMinted',
        });
        console.log(`Total Minted: ${formatUnits(totalMinted as bigint, 0)}`);

        const totalBurnt = await client.readContract({
            address: currencyAddress as `0x${string}`,
            abi: currencyAbi,
            functionName: 'totalBurnt',
        });
        console.log(`Total Burnt: ${formatUnits(totalBurnt as bigint, 0)}`);

        const paused = await client.readContract({
            address: currencyAddress as `0x${string}`,
            abi: currencyAbi,
            functionName: 'paused',
        });
        console.log(`Paused: ${paused}`);

        const wallet = await dfnsApi.wallets.getWallet({ walletId: BANK_WALLET_ID });
        const balance = await client.readContract({
            address: currencyAddress as `0x${string}`,
            abi: currencyAbi,
            functionName: 'balanceOf',
            args: [wallet.address]
        });
        console.log(`Bank Wallet Balance: ${formatUnits(balance as bigint, 0)}`);

    } catch (error) {
        console.error("Error reading view functions:", error);
    }
}

async function broadcast(functionName: string, args: any[] = []) {
    console.log(`Preparing to ${functionName}...`);

    try {
        const data = encodeFunctionData({
            abi: currencyAbi,
            functionName,
            args
        });

        const transaction = {
            kind: "Eip1559",
            to: currencyAddress,
            data: data,
        };

        console.log("Broadcasting transaction...");
        const result = await dfnsApi.wallets.broadcastTransaction({
            walletId: BANK_WALLET_ID,
            body: transaction as any
        });

        console.log("Transaction broadcasted successfully!");
        console.log("Transaction Hash:", result.txHash);

        await client.waitForTransactionReceipt({ hash: result.txHash as `0x${string}` });
        console.log("Transaction confirmed.\n");
    } catch (error) {
        console.error(`Failed to ${functionName}:`, error);
    }
}

async function main() {
    currencyAbi = await getContractABI("StableCoin");

    currencyAddress = await askQuestion("Enter StableCoin Contract Address: ");
    if (!currencyAddress) {
        console.error("Address required.");
        rl.close();
        return;
    }

    while (true) {
        console.log('\n--- StableCoin Operations ---');
        console.log('1. View Status');
        console.log('2. Mint');
        console.log('3. Burn');
        console.log('4. Pause');
        console.log('5. Unpause');
        console.log('6. Exit');

        const choice = await askQuestion('Select an operation (1-6): ');

        switch (choice) {
            case '1':
                await viewFunctions();
                break;
            case '2':
                const toAddress = await askQuestion("Enter Recipient Address: ");
                const mintAmountInput = await askQuestion("Enter Amount to Mint: ");
                const mintAmount = parseUnits(mintAmountInput, 0);
                await broadcast('mint', [toAddress, mintAmount]);
                break;
            case '3':
                const burnAmountInput = await askQuestion("Enter Amount to Burn: ");
                const burnAmount = parseUnits(burnAmountInput, 0);
                await broadcast('burn', [burnAmount]);
                break;
            case '4':
                await broadcast('pause');
                break;
            case '5':
                await broadcast('unpause');
                break;
            case '6':
                console.log('Exiting...');
                rl.close();
                return;
            default:
                console.log('Invalid choice. Please try again.');
        }
    }
}

main();
