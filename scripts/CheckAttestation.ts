import { decodeAbiParameters } from 'viem'
import { client } from './DFNSCommon';

// npm run eas:check 0x0b8430f13c2cc489a4c93b9eb1ef1d37ad7f14b368c50a5e7d7cd61c4797c3a2

const EAS_ADDRESS = '0xC2679fBD37d54388Ce493F1DB75320D236e1815e';

const easAbi = [
    {
        name: 'getAttestation',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'uid', type: 'bytes32' }
        ],
        outputs: [
            {
                name: '',
                type: 'tuple',
                components: [
                    { name: 'uid', type: 'bytes32' },
                    { name: 'schema', type: 'bytes32' },
                    { name: 'time', type: 'uint64' },
                    { name: 'expirationTime', type: 'uint64' },
                    { name: 'revocationTime', type: 'uint64' },
                    { name: 'refUID', type: 'bytes32' },
                    { name: 'recipient', type: 'address' },
                    { name: 'attester', type: 'address' },
                    { name: 'revocable', type: 'bool' },
                    { name: 'data', type: 'bytes' }
                ]
            }
        ]
    }
] as const;

async function main() {
    try {
        console.log("--- Check EAS Attestation ---");

        const args = process.argv.slice(2);
        if (args.length < 1) {
            console.error("Usage: npm run eas:check -- <attestation_uid>");
            process.exit(1);
        }

        const uid = args[0] as `0x${string}`;

        if (!uid.startsWith("0x") || uid.length !== 66) {
            console.error("Error: UID must be a valid 32-byte hex string starting with 0x");
            process.exit(1);
        }

        console.log(`Fetching attestation: ${uid}`);

        const attestation = await client.readContract({
            address: EAS_ADDRESS,
            abi: easAbi,
            functionName: 'getAttestation',
            args: [uid]
        });

        if (attestation.uid === "0x0000000000000000000000000000000000000000000000000000000000000000") {
            console.error("Attestation not found.");
            process.exit(1);
        }

        console.log("\n--- Attestation Details ---");
        console.log(`Schema UID: ${attestation.schema}`);
        console.log(`Attester:   ${attestation.attester}`);
        console.log(`Recipient:  ${attestation.recipient}`);
        console.log(`Time:       ${new Date(Number(attestation.time) * 1000).toLocaleString()}`);
        console.log(`Revocable:  ${attestation.revocable}`);
        
        if (attestation.revocationTime > 0n) {
            console.log(`WARNING: This attestation was revoked at ${new Date(Number(attestation.revocationTime) * 1000).toLocaleString()}`);
        }

        try {
            const decodedData = decodeAbiParameters(
                [
                    { name: 'bond', type: 'address' },
                    { name: 'isin', type: 'string' }
                ],
                attestation.data
            );
            
            console.log("\n--- Decoded Bond Data ---");
            console.log(`Bond Address: ${decodedData[0]}`);
            console.log(`ISIN:         ${decodedData[1]}`);
        } catch (e) {
            console.log("\nCould not decode data as 'address bond, string isin'. It may belong to a different schema.");
        }

    } catch (error) {
        console.error("Failed to fetch attestation:", error);
        process.exit(1);
    }
}

main();
