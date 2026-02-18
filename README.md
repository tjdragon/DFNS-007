# 🏦 Bond Issuance secured by DFNS

Professional Solidity implementation of a corporate bond issuance platform, featuring primary issuance cycles, coupon payments, and redemption at maturity.

## 🌟 Overview

This project implements a fully compliant, tokenized bond lifecycle on the Ethereum blockchain (Sepolia). It allows an issuer to raise capital in Euro Stablecoins (EURC) and investors to receive bond tokens representing their claim to future coupon payments and principal redemption.

The system is designed with a **hybrid approach**:
- **On-chain Settlement**: All value transfers happen on-chain.
- **Off-chain Logic**: Advanced scheduling handled off-chain, with on-chain "pull" mechanisms for claiming.

---

## 🚀 Key Features

- **ERC20 Bond Tokens**: Bonds are represented as standard ERC20 tokens, enabling secondary market trading.
- **Stablecoin Settlement**: All payments (subscription, coupons, redemption) are settled in EUR Stablecoin.
- **Primary Issuance Cycle**: Configurable subscription period with "Delivery vs Payment" (DvP) logic.
- **Coupon System**: Periodic interest payments with flexible funding by the issuer.
- **Default Protection**: automated grace period and default triggering mechanism to protect investors.
- **Accrued Interest View**: Real-time calculation of accrued interest for any holder.

---

## 🔐 Secured by DFNS

All blockchain interactions in this project are secured by **[DFNS](https://www.dfns.co/)**, a Wallet-as-a-Service infrastructure.

-   **Keyless Security**: Private keys are never exposed; they are sharded and distributed using MPC (Multi-Party Computation).
-   **API-Driven**: Operations are performed via secure APIs, ensuring programmatic control and audit trails.
-   **Bank-Grade Custody**: Designed for financial institutions requiring the highest level of security for digital assets.

---

## 🔄 Bond Lifecycle Flows

### 1. 📝 Primary Issuance (Subscription)
Investors subscribe to the bond offering by depositing EURC. They receive a "Subscription Receipt" initially, which is converted to Bond Tokens upon closing.

1.  **Approve**: Investor approves the Bond Contract to spend their EURC.
2.  **Subscribe**: Investor calls `subscribe(amount)`. EURC is held in escrow.
3.  **Close**: Issuer calls `closePrimaryIssuance()`. The clock starts ticking for interest.
4.  **Claim**: Investors call `claimBond()` to mint their ERC20 Bond tokens.

### 2. 💸 Coupon Payments
Interest is paid periodically (e.g., quarterly). The Issuer must fund the contract before investors can claim.

1.  **Fund**: Issuer calls `depositCoupon()` to transfer EURC to the contract. The amount is automatically calculated based on the bond terms.
2.  **Claim**: After the `couponDate`, holders call `claimCoupon(couponIndex)`.
    - *Logic*: `(User Balance / Total Supply) * Coupon Amount` is transferred to the user.

### 3. 🛡️ Grace Period & Default
The contract includes a "watchdog" mechanism.

- **Due Date**: Coupon payment is due.
- **Grace Period**: A 5-day window allows the issuer to fund late without penalty.
- **Default**: If unpaid after 5 days, anyone can call `checkDefault()`.
    - **Outcome**: `isDefaulted` flag is set to `true`.

### 4. 🏁 Redemption (Maturity)
At the end of the bond's life (Maturity Date):

1.  **Fund Principal**: Issuer deposits the total principal amount.
2.  **Redeem**: Holders call `redeem()`.
    - Bond tokens are **burned**.
    - Original principal (Face Value) is returned to the investor in EURC.

---

## 💻 Operational Scripts

The project includes two main scripts for interacting with the contracts:
- `BondOps.ts` (Issuer Operations)
- `HolderOps.ts` (Holder Operations)

### Available Operations

1. **View Status**
   View the current state of the bond (Total Issued, Redeemed, Dates, etc.).

2. **Subscribe (Approve + Subscribe)**
   The Holder must call `EURC.approve()` and then `bond.subscribe()`. The contract cannot "take" their money without their permission.

3. **Close Issuance**
   The Issuer (or an automated timer) calls this once the deadline passes to lock the final funding amount and calculate any oversubscription ratios.

4. **Claim Bond**
   If the bond was oversubscribed, the Holder calls this to "pull" their bond shares and any excess EURC refund into their wallet.

5. **Deposit Coupon**
   The Issuer calls this quarterly to "top up" the contract with EURC. This is the "Push" part of the hybrid model.

6. **Claim Coupon**
   The Holder calls this to "pull" their interest. The script automatically scans for all due, funded, and unclaimed coupons and claims them in sequence.

7. **Redeem**
   At maturity, the Holder calls `bond.redeem()` to exchange the bond for the final Principal. (Note: Issuer deposits principal via `returnPrincipal`).

### Role Breakdown

- **Bond Issuer** (`npm run ops:bond`)
    - (1) View Status
    - (3) Close Issuance
    - (3) Close Issuance
    - (New) Withdraw Proceeds
    - (5) Deposit Coupon
    - (New) Return Principal

- **Bond Holder** (`npm run ops:holder`)
    - (1) View Status (Includes Balance & Accrued Interest)
    - (2) Subscribe
    - (4) Claim Coupon (Automatic detection)
    - (3) Claim Bond

---

## 🧮 Technical Details

### Math & Interest
Interest is accrued linearly based on the configured APR.
```solidity
Accrued = (Principal * APR * TimeElapsed) / (365 days * 10000)
```
*Note: The contract treats a year as 365 days for standardization.*

### Decimals
- **Stablecoin**: Assumed 6 decimals (e.g., EURC/USDC).
- **Bond Token**: 6 decimals.
- **Notional**: Face value per bond (e.g., 100 EUR).
- **Cap**: Maximum amount of funds to be raised (e.g., 10M EUR).

---

## 🛠️ Development & Testing

Built with **Hardhat** and **Viem**.

### Prerequisites
- Node.js > 22
- npm / yarn

### Compile
```bash
npx hardhat compile
```

### Run Tests
Comprehensive test suite covering over-subscription, under-subscription, leap years, and edge cases.
```bash
npx hardhat test
```
*Includes `test/Bond.test.ts`, `test/BondExtended.test.ts`, `test/BondSpecific.test.ts`, and `test/BondFull.test.ts`.*

---

## 🔗 Logical Flow Summary

1.  **Issuance**: Issuer deploys Bond & Stablecoin.
2.  **Subscription**: Investors (`HolderOps` -> Option 2) deposit Stablecoin into the Bond contract.
3.  **Close Issuance**: Issuer (`BondOps` -> Option 2) closes the issuance. The interest accrual clock starts. Issuer calls `withdrawProceeds()` to take the raised funds.
4.  **Claim Bonds**: Investors (`HolderOps` -> Option 3) claim their subscription. **This is when Bond Tokens are minted**.
5.  **Coupons**:
    - **Push**: Issuer (`BondOps` -> Option 5) deposits coupon funds.
    - **Pull**: Investors (`HolderOps` -> Option 4) automatically claim all due coupons.
6.  **Redemption**:
    - **Principal**: Issuer funds via `returnPrincipal` (`BondOps` -> Option 4).
    - **Pull**: Investors (`HolderOps` -> Option 5) redeem their bonds for Principal.

---

## 📄 License
MIT

---

## 📸 Demo (Sepolia Testnet)

Below is a log of a real deployment and interaction on the Sepolia testnet.

### Issuer Address
`0x6784be5606317b1ae050fb92f9a124364ddd8722`

### Holder Address
`0x126b39afd4c1027168bf936b68c4d011793e7609`

### Contract Addresses
- **Stable Coin**: `0xfd33ae0e1d7878f780b5d4a1ae01964972c8ff72`
- **Bond**: `0xb162da11406a38bedf564093c304afb74d948c8f`

### 1. Deploy Stable Coin

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
- [Etherscan Link](https://sepolia.etherscan.io/address/0xfd33ae0e1d7878f780b5d4a1ae01964972c8ff72)

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
- [Etherscan Link](https://sepolia.etherscan.io/address/0xb162da11406a38bedf564093c304afb74d948c8f)

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

- [Subscription Transaction](https://sepolia.etherscan.io/tx/0x1573200dcee8300bcbd71855bd5fd41fa3ad8fe0971bc1d894e9234f9d3be996)

### 6. Bond Operations (Closing Issuance)

```bash
npm run ops:bond
```
- [Closing Issuance Transaction](https://sepolia.etherscan.io/tx/0x3f5f8e5cc7d18f3ccb757dc6a71487f55d259ac9dd36134113cf84c764d2a2e0)

### 7. Holder Claiming Bond

- [Claim Bond Transaction](https://sepolia.etherscan.io/tx/0xd206b41f1554f696337bbd9c9a45431436c9397d066bfc8af2f09300f9443d93)

### 8. Issuer Withdraw Proceeds

- [Withdraw Proceeds Transaction](https://sepolia.etherscan.io/tx/0x6289f283c6670c1714ac640eea55069fd151176e33de77070fd3a6384e3b15dc)

### 9. Holder Checking Status (Accrued Interest)

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

After 5 minutes, the accrued interest should increase:

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

### 10. Issuer funds & Holder claims coupon

- [Coupon Transaction](https://sepolia.etherscan.io/tx/0x709324bcb302e782a47df0225a6a6df0a43a94b3bb6d2d6f131d7ae6bd3b82a5)

---

## 💱 Secondary Trading

Based on the architecture of this project and the current state of DeFi for Real World Assets (RWAs), **UniswapX (RFQ)** is considered the "gold standard" for secondary bond trading.

### 1. Confirming the Approach

For a bond project secured by **Dfns**, the Request-for-Quote (RFQ) model offers significant advantages over traditional AMMs or Order Books:

| Approach | Suitability | Why? |
| :--- | :--- | :--- |
| **Uniswap (AMM)** | 🔴 Low | Bonds have a "fair value" based on yield-to-maturity. AMMs use a passive constant-product curve that causes massive slippage unless millions in liquidity are provided. It also exposes Liquidity Providers to "toxic flow" (arbitrage) when interest rates move. |
| **Order Book (CLOB)** | 🟡 Medium | Precise, but expensive. Maintaining an on-chain Central Limit Order Book is gas-intensive on Ethereum. Moving to an app-chain (like dYdX) introduces significant overhead for a single bond project. |
| **UniswapX / RFQ** | 🟢 **Gold Standard** | **Intent-based.** Professional Market Makers (Fillers) provide off-chain quotes based on real-time bond math. Trades settle on-chain only once a "hard quote" is signed. This offers **zero slippage**, **MEV protection**, and **gasless** swaps for the user. |

**Recommendation:** Utilize **UniswapX (or CowSwap)**. With Dfns, users can sign "Trade Intents" (EIP-712 messages) using MPC-signing APIs without needing to hold ETH for gas.

### 2. Testing in a Local Environment

To test UniswapX or an RFQ system locally, you must simulate the "Filler" (Market Maker) ecosystem, as deploying a single contract is insufficient.

#### Step A: Mainnet Forking
Instead of deploying the entire UniswapX infrastructure, use **Anvil** (Foundry) or **Hardhat** to fork Ethereum Mainnet. This provides access to the existing UniswapX, Permit2, and liquidity infrastructure.

```bash
# Fork mainnet to get all protocol addresses and liquidity
anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

#### Step B: Local Scripting
1.  **Deploy Bond:** Deploy the `DFNS-007` bond contract to the forked network.
2.  **Permit2 Approval:** Simulate user compliance by approving the `Permit2` contract.
3.  **Sign Intent:** Use the [UniswapX SDK](https://github.com/Uniswap/UniswapX-SDK) to generate a `DutchOrder`.
4.  **Mock Filler:** Write a script to act as the "Filler", taking the signed order and calling `reactor.execute()` on the UniswapX Reactor contract.

### 3. Testing on Testnet (Sepolia)

Testing on public testnets requires a "Mock" Filler to pick up orders, as professional market makers may be scarce.

1.  **Deployments:** Utilize Uniswap's existing **Permit2** and **Reactor** deployments on Sepolia.
2.  **Mock Filler Strategy:** Run a simple "Auto-Filler" script:
    *   Monitor the UniswapX Order API.
    *   When a bond order appears, the script (using a separate wallet) "fills" it by providing the requested quote (e.g., EURC) and executing the transaction.
3.  **Dfns Integration:** Ensure the Dfns webhook is configured to handle signature requests for the required EIP-712 intents.

### Summary Checklist

*   [ ] **Standard:** Ensure the bond is **ERC-20** compliant (or wrapped).
*   [ ] **Permit2:** Implement `permit` (EIP-2612) to enable completely gasless flows.
*   [ ] **SDK:** Integrate `@uniswap/uniswapx-sdk` for order creation.

[🎥 **Reference:** How to Trade on UniswapX](https://www.youtube.com/watch?v=8_-KFEsGLvI)

