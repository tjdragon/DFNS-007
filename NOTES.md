# Notes about the order of deployment and tests

- Issuer Address: 0x6784be5606317b1ae050fb92f9a124364ddd8722
- Holder Address: 0x126b39afd4c1027168bf936b68c4d011793e7609

- Stable Coin Address: 0x5e0f3fbb5900f06fce7d2a5d336cc540504609f0
- Bond Address: 0x43c2f1DddCE567c11454B9E36a75986E366A3ae1

## Stable Coin Deployment

### 1. Deploy Stable Coin

To run twice for the issuer and holder

```bash
npm run deploy:stablecoin
```

```text
--- Deploy StableCoin ---
Deploying from wallet address: 0x6784be5606317b1ae050fb92f9a124364ddd8722
Enter StableCoin Name (default: Euro Coin): ECU1
Enter StableCoin Symbol (default: EURC): ECU1
Deployment data encoded.
Broadcasting transaction...
Transaction broadcasted successfully!
Transaction ID: tx-01jhl-h342c-egvbq9ku7903e63v
Transaction Hash: 0xdc77268e85e6999ca9e0c08a59e98446921fb56def53a48381bf5090d32c0595
Waiting for transaction receipt...

!!! DEPLOYMENT SUCCESSFUL !!!
Contract deployed at: 0x5e0f3fbb5900f06fce7d2a5d336cc540504609f0
```
- https://sepolia.etherscan.io/address/0x5e0f3fbb5900f06fce7d2a5d336cc540504609f0
- https://sepolia.etherscan.io/address/0x126b39afd4c1027168bf936b68c4d011793e7609#tokentxns

### 2. Mint Stable Coin

```bash
npm run mint:stablecoin
```
```text
Minting from wallet address (Minter Role): 0x6784be5606317b1ae050fb92f9a124364ddd8722
Enter StableCoin Contract Address: 0x5e0f3fbb5900f06fce7d2a5d336cc540504609f0
Enter Recipient Address: 0x6784be5606317b1ae050fb92f9a124364ddd8722
Enter Amount to Mint: 1000
Function data encoded.
Broadcasting transaction...
Transaction broadcasted successfully!
Transaction ID: tx-01jhl-h5rrs-eslbfh00ribihgqo
Transaction Hash: 0x4687262faa31f70e5c5794b4f0f0e095c9f02e1e1e9dab8ef38af66a58d8158b
Waiting for transaction receipt...

!!! MINT SUCCESSFUL !!!
Transaction Hash: 0x4687262faa31f70e5c5794b4f0f0e095c9f02e1e1e9dab8ef38af66a58d8158b
```

### 3. Bond Deployment

```bash
npm run deploy:bond
```

```text
--- Deploy Bond ---
--- Deploy Bond ---
Deploying from wallet address: 0x6784be5606317b1ae050fb92f9a124364ddd8722
Enter Bond Name (default: Corporate Bond): CJBond
Enter Bond Symbol (default: CB): CJB
Enter Currency Address (StableCoin): 0x5e0f3fbb5900f06fce7d2a5d336cc540504609f0
Enter Notional Amount (default: 100): 1
Enter APR in basis points (default: 400 = 4%): 
Enter Coupon Frequency in seconds (default: 3 months = 7776000): 86400
Enter Duration in seconds to add to now for maturity (default: 1 year = 31536000): 300000
Enter Cap Amount (default: 1000000): 100
Deployment data encoded.
Broadcasting transaction...
Transaction broadcasted successfully!
Transaction ID: tx-01jhl-k65en-ejka8nh6q1mh8p5q
Transaction Hash: 0x396f45c7657d6d378b994f3041020599c533020edea96226963afe1f36e94d3d
Waiting for transaction receipt...

!!! DEPLOYMENT SUCCESSFUL !!!
Contract deployed at: 0x43c2f1dddce567c11454b9e36a75986e366a3ae1
```
- https://sepolia.etherscan.io/address/0x43c2f1dddce567c11454b9e36a75986e366a3ae1

### 4. Stable Coin Operations

```bash
npm run ops:stable
```

### 5. Holder Operations

```bash
npm run ops:holder
```
```text
Enter Subscription Amount (StableCoin): 100
Approving...
Preparing to approve...
Broadcasting transaction...
Transaction Hash: 0x72788b3ed97997b6757fc4f5196a31846c3d8081f2eaed041ca9bb8087cd857d
Transaction confirmed.
```

- https://sepolia.etherscan.io/tx/0x1a84d2e4832d387dba646a4dbb9116454582b22f8d1a908d7d362ffc6c05868e
- 

### 6. Bond Operations

```bash
npm run ops:bond
```
- Closing Issuance: https://sepolia.etherscan.io/tx/0x04eb3f03a69245dc7a307c2184939b0047a4ce6865288c0f9a6d5ea7ccc4fdbf

### 7. Holder Claiming Bond

- https://sepolia.etherscan.io/tx/0xcc4de30ea5a7e5bff4c1337a021b01206960da915d76cc4a2702535de14736b4

### 8. Issuer Withdraw Proceeds

- https://sepolia.etherscan.io/tx/0x93b4af43768f67da7bccb1eecc84a2713b9b4b70fb7d5138df253f4f837e4899
- 0x126b39afd4c1027168bf936b68c4d011793e7609