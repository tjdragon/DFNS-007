# Fixing Decimals

Revision 1

## Context

We are going to fix the decimals which are currently at 0.

## Tasks

- It seems that my decision on decimals was wrong.
- Refactor the contracts to use 6 decimals by default (meaning 6 digits after 0). 
- When I deploy - use those defaults for bonds: 100000 notional (1 bond at 100k notional), 5% APR for the script with a max cap of also 100000. 
- For the scripts, if I want 100000 notional, I should pass 100000 to the script, not 100000000000.
- When I call the views - please return the values in the correct format (i.e. not in wei, but in the correct format for the view) - for example 0.00034 interest.
- Ensure all the maths check out and all tests pass.