# Notes about the order of deployment and tests

## Stable Coin Deployment

### 1. Deploy Stable Coin

```bash
npm run deploy:stablecoin
```

- EURC0
- https://sepolia.etherscan.io/address/0x6b89a8e7e539d12e5a839af8b8b6e82c1afdab2b


### 2. Mint Stable Coin

```bash
npm run mint:stablecoin
```

- Stable: 0x6B89a8E7e539d12E5a839Af8B8b6E82c1afdAb2B
- To: 0x126b39afd4c1027168bf936b68c4d011793e7609
- Amount: 100000000000000
- https://sepolia.etherscan.io/tx/0x9eb155836078e8f22a0bba4876e2cf57bbea11971b4176350186c88caf685cf6
- https://sepolia.etherscan.io/address/0x126b39afd4c1027168bf936b68c4d011793e7609#tokentxns

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