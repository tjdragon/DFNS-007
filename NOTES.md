# Notes about the order of deployment and tests

- Issuer Address: 0x6784be5606317b1ae050fb92f9a124364ddd8722
- Holder Address: 0x126b39afd4c1027168bf936b68c4d011793e7609

- Stable Coin Address: 0xfd33ae0e1d7878f780b5d4a1ae01964972c8ff72
- Bond Address: 0xb162da11406a38bedf564093c304afb74d948c8f

## Stable Coin Deployment

### 1. Deploy Stable Coin

To run twice for the issuer and holder

```bash
npm run deploy:stablecoin
```

```text
--- Deploy StableCoin ---
Deploying from wallet address: 0x6784be5606317b1ae050fb92f9a124364ddd8722
Enter StableCoin Name (default: Euro Coin): ECU Coin
Enter StableCoin Symbol (default: EURC): ECU1
Deployment data encoded.
Broadcasting transaction...
Transaction broadcasted successfully!
Transaction ID: tx-01jhl-scm4o-ebvp05fhuh4cg4b6
Transaction Hash: 0xd1af1887e24b56b895de911bb353bb1089ab6403860b0b1dce89748c5a24d48e
Waiting for transaction receipt...

!!! DEPLOYMENT SUCCESSFUL !!!
Contract deployed at: 0xfd33ae0e1d7878f780b5d4a1ae01964972c8ff72
```
- https://sepolia.etherscan.io/address/0xfd33ae0e1d7878f780b5d4a1ae01964972c8ff72

### 2. Mint Stable Coin

```bash
npm run mint:stablecoin
```
```text
--- Mint StableCoin ---
Minting from wallet address (Minter Role): 0x6784be5606317b1ae050fb92f9a124364ddd8722
Enter StableCoin Contract Address: 0xfd33ae0e1d7878f780b5d4a1ae01964972c8ff72
Enter Recipient Address: 0x126b39afd4c1027168bf936b68c4d011793e7609
Enter Amount to Mint: 1000000
Function data encoded.
Broadcasting transaction...
Transaction broadcasted successfully!
Transaction ID: tx-01jhl-sfo6c-erk8hb5tu1lkcrsl
Transaction Hash: 0x440be9748069f2f4e016939cade180554d5bbf51696a6ab8c1cb5e798b5ef339
Waiting for transaction receipt...

!!! MINT SUCCESSFUL !!!
Transaction Hash: 0x440be9748069f2f4e016939cade180554d5bbf51696a6ab8c1cb5e798b5ef339
```

### 3. Bond Deployment

```bash
npm run deploy:bond
```

```text
--- Deploy Bond ---
Deploying from wallet address: 0x6784be5606317b1ae050fb92f9a124364ddd8722
Enter Bond Name (default: Corporate Bond): Short Bond 1
Enter Bond Symbol (default: CB): SB1
Enter Currency Address (StableCoin): 0xfd33ae0e1d7878f780b5d4a1ae01964972c8ff72
Enter Notional Amount (default: 100): 1000000
Enter APR in basis points (default: 400 = 4%): 
Enter Coupon Frequency in seconds (default: 3 months = 7776000): 300 (every 5 minutes)
Enter Duration in seconds to add to now for maturity (default: 1 year = 31536000): 3600 (1 hour)
Enter Cap Amount (default: 1000000): 1000000
Deployment data encoded.
Broadcasting transaction...
Broadcasting transaction...
Transaction broadcasted successfully!

!!! DEPLOYMENT SUCCESSFUL !!!
Contract deployed at: 0xb162da11406a38bedf564093c304afb74d948c8f
```
- https://sepolia.etherscan.io/address/0xb162da11406a38bedf564093c304afb74d948c8f

### 4. Stable Coin Operations

```bash
npm run ops:stable
```

### 5. Holder Operations (Subscription)

```bash
npm run ops:holder
```
```text
Enter Subscription Amount (StableCoin): 800000
Approving...
Preparing to approve...
Broadcasting transaction...
Transaction broadcasted successfully!
```

- https://sepolia.etherscan.io/tx/0x1573200dcee8300bcbd71855bd5fd41fa3ad8fe0971bc1d894e9234f9d3be996

### 6. Bond Operations (Closing Issuance)

```bash
npm run ops:bond
```
- Closing Issuance: https://sepolia.etherscan.io/tx/0x3f5f8e5cc7d18f3ccb757dc6a71487f55d259ac9dd36134113cf84c764d2a2e0

### 7. Holder Claiming Bond

- https://sepolia.etherscan.io/tx/0xd206b41f1554f696337bbd9c9a45431436c9397d066bfc8af2f09300f9443d93

### 8. Issuer Withdraw Proceeds

- https://sepolia.etherscan.io/tx/0x6289f283c6670c1714ac640eea55069fd151176e33de77070fd3a6384e3b15dc

### 9. Holder checking status (accrued interest)

```text
--- View Functions ---
User Address: 0x126b39afd4c1027168bf936b68c4d011793e7609
My Bond Balance: 800000
My Accrued Interest: 0.207001 EURC
Total Bonds Issued: 800000
Total Bonds Redeemed: 0
Issuance Date: 1771335324 (2/17/2026, 2:35:24 PM)
Maturity Date: 1771338528 (2/17/2026, 3:28:48 PM)
Time to Next Coupon: 84 seconds
```

After 5 minutes, the accrued interest should be 0.340943 EURC:

```text
--- View Functions ---
User Address: 0x126b39afd4c1027168bf936b68c4d011793e7609
My Bond Balance: 800000
My Accrued Interest: 0.340943 EURC
Total Bonds Issued: 800000
Total Bonds Redeemed: 0
Issuance Date: 1771335324 (2/17/2026, 2:35:24 PM)
Maturity Date: 1771338528 (2/17/2026, 3:28:48 PM)
Time to Next Coupon: 264 seconds
```

### 10. Holder claiming coupon