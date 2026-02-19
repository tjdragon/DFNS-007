import { ethers } from 'ethers'

// ECU 1 Stablecoin address from the prompt
export const DEFAULT_CURRENCY_ADDRESS = '0xFD33Ae0e1d7878f780B5d4a1Ae01964972c8Ff72'

// Minimal ERC20 ABI for approval
export const ERC20_ABI = [
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function allowance(address owner, address spender) public view returns (uint256)",
    "function balanceOf(address account) public view returns (uint256)",
    "function decimals() public view returns (uint8)"
]

// Bond ABI - we'll need to populate this or import from the artifacts
// Since I have access to the artifacts, I'll extract them later.
// For now, I'll define a few key methods.
export const BOND_ABI = [
    // Constructor equivalent for deployment isn't here, but we'll use the full ABI for deployment.
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function currency() view returns (address)",
    "function notional() view returns (uint256)",
    "function apr() view returns (uint256)",
    "function frequency() view returns (uint256)",
    "function maturityDate() view returns (uint256)",
    "function cap() view returns (uint256)",
    "function issuanceClosed() view returns (bool)",
    "function isDefaulted() view returns (bool)",
    "function totalSubscribed() view returns (uint256)",
    "function totalBondsIssued() view returns (uint256)",
    "function subscriptionReceipts(address) view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function nextCouponIndex() view returns (uint256)",
    "function couponAmountPerPeriod() view returns (uint256)",

    // State-changing functions
    "function subscribe(uint256 amount) external",
    "function closePrimaryIssuance() external",
    "function withdrawProceeds() external",
    "function depositCoupon() external",
    "function claimBond() external",
    "function claimCoupon(uint256 couponIndex) external",
    "function redeem() external",
    "function checkDefault(uint256 couponIndex) external",
    "function returnPrincipal(uint256 amount) external",

    // Views
    "function accruedInterest(address user) view returns (uint256)",
    "function getCouponAmount() view returns (uint256)",
    "function getNextUnfundedCoupon() view returns (uint256)",
    "function getCouponDate(uint256 couponIndex) view returns (uint256)",
    "function timeToNextCoupon() view returns (uint256)"
]
