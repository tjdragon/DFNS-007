# UI for Bonds

## Context

We are going to develop a very simple UI to demo the bond issuance platform. 
There will be two simple HTML pages that will be ultimately deployed on github.
The interaction with the smart contracts will be via Metamask.

## Design

### Welcome Page

- Create a welcome page - describe the project and DFNS
    - On that welcome page, we have to choose between two personnas: the bond issuer or the bond investor
    - The bond issuer will be able to create a bond
    - The bond investor will be able to buy a bond

### Bond Issuer Page

- Create a page that allows the bond issuer to create a bond
- At the top I need to enter a stable coin address that defaults to 0xFD33Ae0e1d7878f780B5d4a1Ae01964972c8Ff72 (ECU 1)
- The details that must be entered are the same from scripts/DeployBond.ts
- Once all the details have been entered, the bond issuer will be able to create the bond by clicking on a button "Create Bond"
- This button will trigger the deployment of the bond via Metamask
- The user therefore must first connect to Metamask
- Then the signing of the pre-built raw payload will be triggered
- Finally the transaction will be sent to the blockchain
- The UI should display the result of the transaction
- Implement all the functions from contracts/Bond.sol that are "onlyOwner"

Also:

- There are a bunch of view operations from the deployed smart contract that shoud also be in the page:
    - Implement and display nicely all the views

### Bond Investor Page

- Once the bond has been created, the investor can subscribe
- Add a box where I can enter the bond smart contract address at the top to make it flexible
- I need a section where the investor will approve the bond smart contract to spend some ERC20
- There is a section where the investor will subscribe to the bond from contracts/Bond.sol: subscribe, claimBond, accruedInterest, claimCoupon, redeem, checkDefault
- All with Metamask

## Implementation

- Use the best technologies from Tailwind CSS, React, Vite or Typescript
- Make it look good and professional
- Show me how to test it locally
- We will take care of the deployment later 