# 🏦 Bond Multiple Currencies Upgrade

## 🎯 Objective
Refactor `Bond.sol` to allow holders to subscribe using multiple predefined ERC20 tokens (e.g., USDC, USDT, etc.), while specifying absolute caps per token. The primary currency for all payouts (coupons and redemption) will be designated independently.

## 🔑 Design Decisions
- **Option A Approach (Single Payout Currency):** We will use ONE `primaryCurrency` for payouts (e.g., base unit like USDC). Subscriptions in any allowed tokens are treated as abstract "Bond Shares" sharing the same valuation.
- **Decimals:** All allowed stablecoins are assumed to have precisely 6 decimals and a 1:1 value peg.
- **Caps:** Token-specific limits are defined as absolute amounts (e.g., max 200,000 USDT) as opposed to dynamic percentages.

---

## 🏗️ Implementation Details

### 1. Data Structure Updates (Bond.sol)
Replace `IERC20 public currency` with `IERC20 public primaryCurrency;` to denote the payout currency.

Add tracking logic for allowed subscription tokens:
```solidity
struct TokenConfig {
    bool isAllowed;
    uint256 absoluteLimit;
    uint256 totalRaised;
}

mapping(address => TokenConfig) public allowedTokens;
address[] public supportedTokens;
```

### 2. Constructor & Token Management
Update the constructor to take the `primaryCurrency`, the `allowedTokens` array, and their corresponding `absoluteLimits`.

```solidity
constructor(
    string memory name,
    string memory symbol,
    address _primaryCurrency,
    address[] memory _allowedTokens,
    uint256[] memory _absoluteLimits,
    ...
)
```
Loop through `_allowedTokens` to populate the `allowedTokens` mapping and `supportedTokens` array.

### 3. Subscription Flow (`subscribe`)
Modify `subscribe` to accept a `token` address.

```solidity
function subscribe(address token, uint256 amount) external {
    require(!issuanceClosed, "Issuance closed");
    require(allowedTokens[token].isAllowed, "Token not allowed");
    require(amount > 0, "Amount must be > 0");

    // Check Limits
    require(totalSubscribed + amount <= cap, "Global cap exceeded");
    require(allowedTokens[token].totalRaised + amount <= allowedTokens[token].absoluteLimit, "Token absolute limit exceeded");

    // Accounting
    totalSubscribed += amount;
    allowedTokens[token].totalRaised += amount;
    subscriptionReceipts[msg.sender] += amount;

    // Transfer
    IERC20(token).transferFrom(msg.sender, address(this), amount);
    emit Subscribed(msg.sender, token, amount);
}
```

### 4. Payout Withdrawals (`withdrawProceeds`)
Add the ability for the issuer to individually pull funds from different tokens.
```solidity
function withdrawProceeds(address token) external onlyOwner {
    require(issuanceClosed, "Issuance not closed");
    require(allowedTokens[token].isAllowed, "Token not allowed");
    uint256 balance = IERC20(token).balanceOf(address(this));
    require(balance > 0, "No proceeds for token");
    IERC20(token).transfer(msg.sender, balance);
}
```

### 5. Payout Refactoring
Ensure that `returnPrincipal`, `depositCoupon`, `claimCoupon`, and `redeem` exclusively use the `primaryCurrency` interface to pull from the issuer and send to the holder.

---

## ✅ Verification Checklist
1. Update tests to deploy multiple mock stablecoins (USDT & USDC).
2. Authorize both stablecoins in the constructor.
3. Test that subscribing with `USDT` honors the absolute limit specifically defined for `USDT`.
4. Test that exceeding the absolute limit reverts identically to exceeding the global cap.
5. Emulate full lifecycle: Subscribe with mixed tokens (USDC and USDT), but claim coupons and redeem solely via USDC (`primaryCurrency`).
