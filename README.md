# 🏦 Bond Issuance on Ethereum

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
