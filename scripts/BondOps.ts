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

let bondAbi: any;
let currencyAbi: any;
let bondAddress: string;

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
        const totalIssued = await client.readContract({
            address: bondAddress as `0x${string}`,
            abi: bondAbi,
            functionName: 'totalBondsIssued',
        });
        console.log(`Total Bonds Issued: ${totalIssued}`);

        const totalRedeemed = await client.readContract({
            address: bondAddress as `0x${string}`,
            abi: bondAbi,
            functionName: 'totalBondsRedeemed',
        });
        console.log(`Total Bonds Redeemed: ${totalRedeemed}`);

        const issuanceDate = await client.readContract({
            address: bondAddress as `0x${string}`,
            abi: bondAbi,
            functionName: 'issuanceDate',
        });
        console.log(`Issuance Date: ${issuanceDate} (${new Date(Number(issuanceDate) * 1000).toLocaleString()})`);

        const maturityDate = await client.readContract({
            address: bondAddress as `0x${string}`,
            abi: bondAbi,
            functionName: 'maturityDate',
        });
        console.log(`Maturity Date: ${maturityDate} (${new Date(Number(maturityDate) * 1000).toLocaleString()})`);

        const timeToNext = await client.readContract({
            address: bondAddress as `0x${string}`,
            abi: bondAbi,
            functionName: 'timeToNextCoupon',
        });
        console.log(`Time to Next Coupon: ${timeToNext} seconds`);

    } catch (error) {
        console.error("Error reading view functions:", error);
    }
}

async function broadcast(contractAddress: string, abi: any, functionName: string, args: any[] = []) {
    console.log(`Preparing to ${functionName}...`);

    try {
        const data = encodeFunctionData({
            abi,
            functionName,
            args
        });

        const transaction = {
            kind: "Eip1559",
            to: contractAddress,
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
    bondAbi = await getContractABI("Bond");
    currencyAbi = await getContractABI("StableCoin");

    bondAddress = await askQuestion("Enter Bond Contract Address: ");
    if (!bondAddress) {
        console.error("Bond address required.");
        rl.close();
        return;
    }

    while (true) {
        console.log('\n--- Bond Issuer Operations ---');
        console.log('1. View Status');
        console.log('2. Close Issuance');
        console.log('3. Withdraw Proceeds');
        console.log('4. Return Principal');
        console.log('5. Deposit Coupon');
        console.log('6. Exit');

        const choice = await askQuestion('Select an operation (1-6): ');

        switch (choice) {
            case '1':
                await viewFunctions();
                break;
            case '2':
                await broadcast(bondAddress, bondAbi, 'closePrimaryIssuance');
                break;
            case '3':
                await broadcast(bondAddress, bondAbi, 'withdrawProceeds');
                break;
            case '4':
                const principalAmountInput = await askQuestion("Enter Principal Amount to Return: ");
                const principalAmount = parseUnits(principalAmountInput, 6);

                // Get Currency Address
                const currencyAddressForPrincipal = await client.readContract({
                    address: bondAddress as `0x${string}`,
                    abi: bondAbi,
                    functionName: 'currency',
                }) as string;

                console.log("Approving...");
                // We need to approve the bond contract to pull the currency from the issuer
                // Using the broadcast helper for the currency contract might be tricky if we don't have its ABI loaded in a generic way
                // But we do have currencyAbi loaded in main()
                await broadcast(currencyAddressForPrincipal, currencyAbi, 'approve', [bondAddress, principalAmount]);

                console.log("Returning Principal...");
                await broadcast(bondAddress, bondAbi, 'returnPrincipal', [principalAmount]);
                break;
            case '5':
                const couponIndex = await askQuestion("Enter Coupon Index: ");
                const couponAmountInput = await askQuestion("Enter Coupon Amount: ");
                const couponAmount = parseUnits(couponAmountInput, 6);

                // Get Currency Address from Bond
                const currencyAddressForCoupon = await client.readContract({
                    address: bondAddress as `0x${string}`,
                    abi: bondAbi,
                    functionName: 'currency',
                }) as string;

                console.log("Approving...");
                await broadcast(currencyAddressForCoupon, currencyAbi, 'approve', [bondAddress, couponAmount]);
                console.log("Depositing Coupon...");
                await broadcast(bondAddress, bondAbi, 'depositCoupon', [BigInt(couponIndex), couponAmount]);
                break;
            case '6':
                console.log('Exiting...');
                rl.close();
                process.exit(0);
            default:
                console.log('Invalid choice. Please try again.');
        }
    }
}

main();
