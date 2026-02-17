# Fixing the coupons logic

Revision 1

## Context

If the issuer deposits a coupon amount higher than the expected interest (based on APR), the bond holders will simply receive a larger payout.

The smart contract logic for claiming a coupon is:

```solidity
uint256 share = (balance * totalCouponAmount) / total;
```

It calculates the holder's share based purely on the total amount deposited for that specific coupon index. It does not check against the APR or the accruedInterest view function.

So, if you deposit 100,000 ECU for a coupon instead of 12,500 ECU, the holders will receive a share of the 100,000 proportional to their bond holdings.

The accruedInterest function is only for display purposes (showing what should be accrued based on the APR) and does not limit the actual payout.

We need to put some railguards in place to prevent overpaying for coupons.

## Tasks

I think we should do the following:

1. Add view functions to return the coupon funded amounts and not funded amounts for all coupons - add them to scripts/BondOps.ts
2. When we create the bond, we have all the details to work out the exact coupon payments in advance. Therefore I suggest we pre-calculate the coupon payment value at creation time.
3. Since after (2) we have the coupon payment value, we can use that to limit the coupon deposit amount to the exact value. If the issuer does not deposit the exact coupon payment value, we can reject the deposit.
4. We can have a view function that returns the coupon payment value.
5. I would also suggest that for   function depositCoupon(uint256 couponIndex,uint256 amount) we do not need to pass in the couponIndex as we can work it out internally using the first non-funded coupon index. amount is also not needed as we will use the coupon payment value calculated at creation time.

- Check the logic from above and confirm it is correct
- Once confirmed, create an implementation plan
- Check all code compiles and all unit tests pass