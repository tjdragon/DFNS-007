# On-Chain Attestation Verification Design

## Objective
Verify that `_currency` (or another parameter) is part of a valid EAS attestation during the deployment of the `Bond` contract.

1. An attestation has been created for a stable coin (address, issuer, etc) using scripts/CreateAttestation.ts
2. The bond contract will check the attestation when it is deployed - if valid - otherwise the contract deployment will fail.

## Design
The best approach is to pass the **Attestation UID** to the `Bond` contract's constructor, then use the `IEAS` interface to query the Attestation Service on-chain.

### 1. EAS Interface
Define the interface to query the EAS registry.
```solidity
interface IEAS {
    struct Attestation {
        bytes32 uid;
        bytes32 schema;
        uint64 time;
        uint64 expirationTime;
        uint64 revocationTime;
        bytes32 refUID;
        address recipient;
        address attester;
        bool revocable;
        bytes data;
    }

    function getAttestation(bytes32 uid) external view returns (Attestation memory);
}
```

### 2. Constructor Implementation
The constructor should accept the UID, fetch the attestation, and strictly validate its properties before decoding the payload.

```solidity
    // EAS Contract Address (Sepolia)
    IEAS public constant eas = IEAS(0xC2679fBD37d54388Ce493F1DB75320D236e1815e);
    
    // Trusted Wallet (e.g. DFNS Wallet ID)
    address public constant TRUSTED_ATTESTER = 0x126b39aFd4c1027168bf936B68C4d011793E7609;

    // The registered Schema UID
    bytes32 public constant EXPECTED_SCHEMA = 0xcf734e953bdc780dfcdda13c939ba45b9aae48894744bf8568f6fdcbc327d4a0;

    constructor(
        string memory name,
        string memory symbol,
        address _currency,
        uint256 _notional,
        uint256 _apr,
        uint256 _frequency,
        uint256 _maturityDate,
        uint256 _cap,
        bytes32 _attestationUid // Accept UID as an argument
    ) ERC20(name, symbol) Ownable(msg.sender) {
        
        // 1. Fetch the attestation
        IEAS.Attestation memory attestation = eas.getAttestation(_attestationUid);

        // 2. Validate attestation integrity and trust
        require(attestation.uid != 0, "Attestation does not exist");
        require(attestation.schema == EXPECTED_SCHEMA, "Invalid schema");
        require(attestation.attester == TRUSTED_ATTESTER, "Untrusted attester");
        require(attestation.revocationTime == 0, "Attestation was revoked");

        // 3. Decode the attestation data payload
        // Note: adjust the decode types based on the exact schema structure
        (address attestedAddress, string memory isin) = abi.decode(attestation.data, (address, string));

        // 4. Enforce the requirement 
        require(attestedAddress == _currency, "Currency does not match attestation");

        // ... continue standard initialization ...
        currency = IERC20(_currency);
        notional = _notional;
        // ...
    }
```

### Benefits
1. **Trustless:** The contract independently verifies the claim on-chain against a trusted registry and trusted issuer.
2. **Immutable Guarantee:** The contract mathematically ensures it is only bound to the specific data (e.g., currency) attested to globally in the EAS schema.
