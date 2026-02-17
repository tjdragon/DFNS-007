# Notes about the order of deployment and tests

- Issuer Address: 0x6784be5606317b1ae050fb92f9a124364ddd8722
- Holder Address: 0x126b39afd4c1027168bf936b68c4d011793e7609

- Stable Coin Address: 0x5e0f3fbb5900f06fce7d2a5d336cc540504609f0
- Bond Address: 0xccb8218776eb61d36207d8dd350ff16cee71bb3a

## Stable Coin Deployment

### 1. Deploy Stable Coin

To run twice for the issuer and holder

```bash
npm run deploy:stablecoin
```

### 2. Mint Stable Coin

```bash
npm run mint:stablecoin
```

### 3. Bond Deployment

```bash
npm run deploy:bond
```

```text
--- Deploy Bond ---
Deploying from wallet address: 0x6784be5606317b1ae050fb92f9a124364ddd8722
Enter Bond Name (default: Corporate Bond): SB1
Enter Bond Symbol (default: CB): SB1
Enter Currency Address (StableCoin): 0x5e0f3fbb5900f06fce7d2a5d336cc540504609f0
Enter Notional Amount (default: 100): 1
Enter APR in basis points (default: 400 = 4%): 1000
Enter Coupon Frequency in seconds (default: 3 months = 7776000): 60
Enter Duration in seconds to add to now for maturity (default: 1 year = 31536000): 3600
Enter Cap Amount (default: 1000000): 100
Deployment data encoded.
Broadcasting transaction...
Broadcasting transaction...
Transaction broadcasted successfully!
```

### 4. Stable Coin Operations

```bash
npm run ops:stable
```

### 5. Holder Operations

```bash
npm run ops:holder
```
```text
Enter Subscription Amount (StableCoin): 50
Approving...
Preparing to approve...
Broadcasting transaction...
Transaction Hash: 0xd463ca33419f53c91aee01d3a4001fdacce70b26f96756b578038d92898bb487
Transaction confirmed.
```

### 6. Bond Operations

```bash
npm run ops:bond
```
- Closing Issuance: https://sepolia.etherscan.io/tx/0xa06ee91c4bd6313998cdb9358ba33e2698cec009b3df82d12548a2252b17b2d9

### 7. Holder Claiming Bond

- https://sepolia.etherscan.io/tx/0xcc4de30ea5a7e5bff4c1337a021b01206960da915d76cc4a2702535de14736b4

### 8. Issuer Withdraw Proceeds

- https://sepolia.etherscan.io/tx/0x93b4af43768f67da7bccb1eecc84a2713b9b4b70fb7d5138df253f4f837e4899
- 0x126b39afd4c1027168bf936b68c4d011793e7609