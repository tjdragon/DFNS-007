# Issuing Bonds on Ethereum

Revision 2

## Context

We are going to develop and interact with a smart contract that issues bonds on the Ethereum blockchain.

## Core Architecture

The smart contract will be written in Solidity and deployed on the Ethereum blockchain (Sepolia).
Events are created wherever necessary.

### Basics

- The contract acts as a vault (With Notional, APR, Frequency, Maturity Date)
- Primary issuance: future holders subscribe to the bond and receive a "Subscription Receipt" (internal mapping).
- Holders pull their shares out whenever - but it has to be just after the coupon date (based on frequency)
- We will use the ERC20 token standard for the bond shares using OpenZeppelin.
- We will use the ERC20 token standard for the EUR stablecoins using OpenZeppelin.
- Some state variables are required on the bond contract:

```solidity
mapping(uint256 => bool) public couponFunded; (Tracks if Q1, Q2, etc., are paid).
uint256 public constant GRACE_PERIOD = 5 days;
bool public isDefaulted;
```
- We are going for a hybrid approach - meaning we following traditional finance for coupon payments but we will use a view function to get the accrued interest:
```logic
(Balance * APR * Time_Elapsed) / Year_Seconds
```

### Primary Issuance

For primary issuance, we use the DvP (Delivery vs Payment) flow.
This is done in three steps:

- Approval: The holder calls the approve() function on the EURC contract, allowing your Bond Contract to take $X$ amount.
- Subscription: The holder calls bondContract.subscribe(amount).
- Escrow: The bond contract pulls the EURC and holds it in an Escrow State. The investor doesn't get the bond tokens yet; they get a "Subscription Receipt" (internal mapping).
- THe issuer can close the primary issuance at any time by calling a function called closePrimaryIssuance()

#### Handling over-subscription

First-Come-First-Served: the subscribe function checks a totalSubscribed variable. Once it hits the cap, the function simply reverts any new attempts.

### Pull Payment (Settlement)

- Holders call a function to claim the coupon:
```solidity
claimCoupon(uint256 couponIndex)
```
- logic:
    - Check: Is block.timestamp > couponDate[couponIndex]?
    - Check: Has the Issuer funded this specific coupon?
    - Check: Has this user already claimed for this period?
    - Action: Transfer (UserBalance / TotalSupply) * CouponAmount in EUR Stablecoins
    
### Grace Period and Default Trigger

- This is the "watchdog" logic. If the clock hits the couponDate + GRACE_PERIOD and the contract balance is still insufficient, anyone (or a specific oracle) can trigger the Default state.

| State |    Condition | Consequence |
| :--- | :--- | :--- |
| Active | Current Time < Coupon Date | All good; interest accruing in "View." |
| Due | Current Time > Coupon Date | Holders can begin "Pulling" payments. |
| Grace | Date + 5 Days (Unfunded) | Issuer can still deposit without penalty. |
| DEFAULT | Date + 5 Days (Still Unfunded) | Status flips to Defaulted. Transfers might freeze; legal action triggered. |

### Redemption at Maturity

- At the end of the bond's life (e.g., 2 years), the redeem() function activates.
- Issuer: Must deposit the total Principal (Face Value) in EURO StableCoin.
- Holder: Calls redeem(). The contract "burns" their bond tokens and sends them back their original Euro investment.

### Implementation

- The bond must have a face value (in EUR stablecoin like 100), and APR like 4%, frequency like quarterly and a maturity date like 20270130 (for 30th of Jan 2027) in the constructor
- Use OpenZeppelin
- Implement a specific lib for all the maths to be used by the Bond contract - be careful of leap years
- You can reuse an existing stablecoin implementation from /home/tj/Code/DFNS/StableCoin/contracts/StableCoin.sol
- Use Hardhat (already installed) for development and testing
- Develop extensive tests for all the scenarios described above
- We will take care of real deployment and CLI to interest with the contract later in another prompt - focus on development and local testing
- Any question or clarification needed on any of the flows, just ask
