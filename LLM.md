# Support for ISIN and Identifiers 

## Context

I need to publis some attestations using EAS (https://attest.org/) for bonds - meaning I need to be able to attest that a smart contract address has a given ISIN.

## Tasks

- I am using DFNS and TypeScript has a language
- I am using Sepolia
- Create a RegisterSchema script in scripts to register the schema: "address bond, string isin"
- Create a CreateAttestation script in scripts to create an attestation by taking the arguments in the command line
- You can use "wa-01jh6-h40vk-eoq9u6gnnbl525ke" as a DFNS wallet id
- Any questions - just ask 