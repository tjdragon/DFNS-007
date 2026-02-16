# Deploying and Testing On-Chain

Revision 1

## Context

So far we have created some smart contracts and we have tested them locally.
We are now going to deploy them on-chain and test them on-chain using DFNS.

## Tasks

Using existing working code from another project: /home/tj/Code/DFNS/StableCoin/dfns

- Use a Command Line Interface (CLI) for the scripts
- Add a scripts section to package.json to invoke the scripts like in /home/tj/Code/DFNS/StableCoin/package.json
- Create two deployment scripts for contracts/Bond.sol and contracts/StableCoin.sol in the scripts/ folder
    - Use the BANK_WALLET_ID (/home/tj/Code/DFNS/StableCoin/dfns/DFNSCommon.ts) to deploy them both
    - For the constructors, we will pass the arguments to both scripts
- Create a mint script to mint some stable coins to an address: both the amount and wallet address are passed as arguments to the script
- Create an Ops Script for the Bond that allows to invoke all functions as owner or holder - each argument is passed as an argument from the CLI (Check out the ops scripts from /home/tj/Code/DFNS/StableCoin/dfns)
- Confirm no other script is required or suggest scripts to add
- Any question, just ask