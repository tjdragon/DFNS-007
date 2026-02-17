# Full Life-Cycle Unit Test

Revision 1

## Context

We are going to create a dedicated unit test for the full bon life-cycle

## Tasks

- Create a new unit test BonFull
- Create a ECU stable coin
- The Issuer creates a bond with 1_000_000 notional, 5% APR, Quaterly Coupon, 1 year maturity
- There are 4 holders subscribing: one at 100k, one at 200k, one at 200k and the last one at 500k
- The issuer then closes the primary issuance: closePrimaryIssuance()
- The issuer withdraws proceeds: withdrawProceeds()
- All 4 holders claim back their shares: claimBond()
- Before each coupon payment the issuer deposits the coupons: depositCoupon()
- The holders clain back their coupons: claimCoupon()
- Finally the bond is redeemed: redeem()
- For each step ensures tokens have been transferred successfully to the relevant party