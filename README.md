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

## 🔄 Bond Lifecycle Flows

### 1. 📝 Primary Issuance (Subscription)
Investors subscribe to the bond offering by depositing EURC. They receive a "Subscription Receipt" initially, which is converted to Bond Tokens upon closing.

1.  **Approve**: Investor approves the Bond Contract to spend their EURC.
2.  **Subscribe**: Investor calls `subscribe(amount)`. EURC is held in escrow.
3.  **Close**: Issuer calls `closePrimaryIssuance()`. The clock starts ticking for interest.
4.  **Claim**: Investors call `claimBond()` to mint their ERC20 Bond tokens.

### 2. 💸 Coupon Payments
Interest is paid periodically (e.g., quarterly). The Issuer must fund the contract before investors can claim.

1.  **Fund**: Issuer calls `depositCoupon(couponIndex, amount)` to transfer EURC to the contract.
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

## 🧮 Technical Details

### Math & Interest
Interest is accrued linearly based on the configured APR.
```solidity
Accrued = (Principal * APR * TimeElapsed) / (365 days * 10000)
```
*Note: The contract treats a year as 365 days for standardization.*

### Decimals
- **Stablecoin**: Assumed 6 decimals (e.g., EURC/USDC).
- **Bond Token**: 0 decimals (Indivisible units).
- **Notional**: Face value per bond (e.g., 100 EUR).

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
*Includes `test/Bond.test.ts` and `test/BondExtended.test.ts`.*

---

## 📄 License
MIT
