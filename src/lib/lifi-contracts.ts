// LI.FI Diamond contract address — same on all major EVM chains
// Source: https://docs.li.fi/smart-contracts/deployments-contract-addresses
const LIFI_DIAMOND = '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae';

export function isValidLifiTarget(to: string): boolean {
  return to.toLowerCase() === LIFI_DIAMOND;
}
