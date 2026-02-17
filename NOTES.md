# Notes about the order of deployment and tests

- Issuer Address: 0x6784be5606317b1ae050fb92f9a124364ddd8722
- Holder Address: 0x126b39afd4c1027168bf936b68c4d011793e7609

- Stable Coin Address: 0x5e0f3fbb5900f06fce7d2a5d336cc540504609f0


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
- Deploying from wallet address: 0x6784be5606317b1ae050fb92f9a124364ddd8722
- Enter Bond Name (default: Corporate Bond): Corp Bond 0
- Enter Bond Symbol (default: CB): CB0
- Enter Currency Address (StableCoin): 0x6B89a8E7e539d12E5a839Af8B8b6E82c1afdAb2B
- Enter Notional Amount (default: 100): 50000
- Enter APR in basis points (default: 400 = 4%): 
- Enter Coupon Frequency in seconds (default: 3 months = 7776000): 86400
- Enter Duration in seconds to add to now for maturity (default: 1 year = 31536000): 259200
- https://sepolia.etherscan.io/tx/0x6eae5d61efcd91ed99ebbe5bd8c0656610b5b6f54e1e5ab899430af8370a14f5
- https://sepolia.etherscan.io/address/0x1e0e8d14df06d83269871bc72d1d8322ebdef993

### 4. Stable Coin Operations

```bash
npm run ops:stable
```

### 5. Holder Operations

```bash
npm run ops:holder
```

- Subscribed for 5000: https://sepolia.etherscan.io/tx/0x7f3afd78c2d2deb55431e5ef1b62586b2e225e45a2827ce60b71fffbb6ffbddd

### 6. Bond Operations

```bash
npm run ops:bond
```
- Closing Issuance: https://sepolia.etherscan.io/tx/0xe8b305188091345375928632f023a9254f4713cca3b0b234b8e4faed31df6d6a