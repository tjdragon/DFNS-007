import { encodeAbiParameters, encodeFunctionData, keccak256, encodePacked } from 'viem'
import { dfnsApi, SENDER_WALLET_ID, client } from './DFNSCommon';

const EAS_ADDRESS = '0xC2679fBD37d54388Ce493F1DB75320D236e1815e';

const easAbi = [
    {
        name: 'attest',
        type: 'function',
        stateMutability: 'payable',
        inputs: [
            {
                name: 'request',
                type: 'tuple',
                components: [
                    { name: 'schema', type: 'bytes32' },
                    { 
                        name: 'data', 
                        type: 'tuple', 
                        components: [
                            { name: 'recipient', type: 'address' },
                            { name: 'expirationTime', type: 'uint64' },
                            { name: 'revocable', type: 'bool' },
                            { name: 'refUID', type: 'bytes32' },
                            { name: 'data', type: 'bytes' },
                            { name: 'value', type: 'uint256' }
                        ] 
                    }
                ]
            }
        ],
        outputs: [{ name: '', type: 'bytes32' }]
    }
] as const;

async function main() {
    try {
        console.log("--- Create EAS Attestation ---");

        const args = process.argv.slice(2);
        if (args.length < 2) {
            console.error("Usage: npm run eas:attest -- <bond_address> <isin>");
            process.exit(1);
        }

        const bondAddress = args[0] as `0x${string}`;
        const isin = args[1];

        if (!bondAddress.startsWith("0x")) {
            console.error("Error: bond_address must be a valid Ethereum address starting with 0x");
            process.exit(1);
        }

        const schemaString = "address bond, string isin";
        const resolver = "0x0000000000000000000000000000000000000000";
        const revocable = true;

        // The UID is computed as keccak256(abi.encodePacked(schema, resolver, revocable))
        const schemaUID = keccak256(encodePacked(
            ['string', 'address', 'bool'],
            [schemaString, resolver, revocable]
        ));

        console.log(`Schema UID: ${schemaUID}`);
        console.log(`Attesting Bond: ${bondAddress}`);
        console.log(`ISIN: ${isin}\n`);

        // Encode the specific data for the schema (address bond, string isin)
        const encodedData = encodeAbiParameters(
            [
                { name: 'bond', type: 'address' },
                { name: 'isin', type: 'string' }
            ],
            [bondAddress, isin]
        );

        const data = encodeFunctionData({
            abi: easAbi,
            functionName: 'attest',
            args: [{
                schema: schemaUID,
                data: {
                    recipient: "0x0000000000000000000000000000000000000000",
                    expirationTime: 0n, // 0 = no expiration
                    revocable: revocable,
                    refUID: "0x0000000000000000000000000000000000000000000000000000000000000000",
                    data: encodedData,
                    value: 0n
                }
            }]
        });

        const transaction = {
            kind: "Eip1559",
            to: EAS_ADDRESS,
            data: data,
        };

        console.log(`Broadcasting transaction from wallet ${SENDER_WALLET_ID}...`);

        const result = await dfnsApi.wallets.broadcastTransaction({
            walletId: SENDER_WALLET_ID,
            body: transaction as any
        });

        if (result.txHash) {
            console.log("\nTransaction Hash:", result.txHash);
            console.log("Waiting for transaction receipt...");
            const receipt = await client.waitForTransactionReceipt({ hash: result.txHash as `0x${string}` });
            console.log("\n!!! ATTESTATION SUCCESSFUL !!!");
            console.log("Transaction confirmed in block:", receipt.blockNumber);
            console.log("See Tx on Sepolia:", `https://sepolia.etherscan.io/tx/${result.txHash}`);
            console.log("Check EAS Scan:", `https://sepolia.easscan.org/schema/${schemaUID}`);
        } else {
            console.log("Transaction pending or requiring approval. ID:", result.id);
            console.log("Status:", (result as any).status);
        }

    } catch (error) {
        console.error("Failed to create attestation:", error);
        process.exit(1);
    }
}

main();
