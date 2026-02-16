# Views

Revision 1

## Context

Add as many views functions to Bonds and Stable Coins contract to query the state of the contract

## Tasks

### contracts/StableCoin.sol

Add view functions to query the state of the contract:

- Total minted
- Total burnt
- Is Paused?
- Total minted per address
- etc - anything you can think of

### contracts/Bond.sol

Add view functions to query the state of the contract:

- Total bonds issued
- Total bonds redeemed
- Total bonds outstanding
- Total bonds outstanding per address
- How much time before next coupon payment
- etc - anything you can think of

## Specific Unit Test

- Add a specific unit test where a bond has a maturity date of 1 week from today - and just one coupon payment at the end in a specific test file. 