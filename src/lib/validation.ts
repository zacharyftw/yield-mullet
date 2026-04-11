const ETH_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

const VALID_SORT_FIELDS = new Set(['apy', 'tvl', 'name']);

export class ValidationError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'ValidationError';
  }
}

export function validateAddress(v: string | null, name: string): string {
  if (!v || !ETH_ADDRESS_RE.test(v)) throw new ValidationError(`Invalid ${name}`);
  return v;
}

export function validateChainId(v: string | null, name: string): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new ValidationError(`Invalid ${name}`);
  return n;
}

export function validateSortBy(v: string | null): string | undefined {
  if (!v) return undefined;
  if (!VALID_SORT_FIELDS.has(v)) throw new ValidationError('Invalid sortBy');
  return v;
}

export function validateAmount(v: string | null): string {
  if (!v || !/^\d+$/.test(v)) throw new ValidationError('Invalid fromAmount');
  const amount = BigInt(v);
  if (amount <= BigInt(0)) throw new ValidationError('fromAmount must be positive');
  if (amount > BigInt("100000000000000000000000000")) throw new ValidationError('fromAmount exceeds maximum');
  return v;
}
