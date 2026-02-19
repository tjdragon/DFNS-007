# UI Fixes

## Context

First version has been deployed and is more or less working. 
We need to fix missing features

## Fixes


### Bond Issuer Page

- Add the view functions as implemented here: scripts/BondOps.ts function is called "async function viewFunctions()"

### Bond Investor Page

- Also add the view functions as implemented here: scripts/BondOps.ts function is called "async function viewFunctions()"
- When I click on "Subscribe now", I get the error: "contract.subscribe is not a function": the function is " function subscribe(uint256 amount) external " in file contracts/Bond.sol

### Implementation

- Fix the two issues above