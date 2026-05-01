import { lookup as dnsLookup } from 'node:dns/promises';

import { validateCrawlUrl } from './url-policy.js';

export async function validateResolvedCrawlUrl(input, options = {}) {
  const base = validateCrawlUrl(input);
  if (!base.ok) return base;

  const lookup = options.lookup ?? ((hostname) => dnsLookup(hostname, { all: true }));
  const addresses = await lookup(base.hostname);

  if (addresses.some((item) => isPrivateResolvedAddress(item.address))) {
    return { ok: false, reason: '해당 호스트가 내부망 또는 차단된 주소로 해석됩니다.' };
  }

  return base;
}

function isPrivateResolvedAddress(address) {
  if (address.includes(':')) {
    return address === '::1' || address.toLowerCase().startsWith('fc') || address.toLowerCase().startsWith('fd') || address.toLowerCase().startsWith('fe80');
  }

  const parts = address.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return true;

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    a === 0
  );
}
