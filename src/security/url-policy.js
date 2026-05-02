const BLOCKED_HOSTS = new Set(['localhost', 'localhost.localdomain']);

export function validateCrawlUrl(input) {
  let parsed;
  const normalizedInput = normalizeUrlInput(input);

  try {
    parsed = new URL(normalizedInput);
  } catch {
    return { ok: false, reason: 'URL 형식이 올바르지 않습니다.' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, reason: '지원하지 않는 프로토콜입니다.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTS.has(hostname) || hostname.endsWith('.localhost')) {
    return { ok: false, reason: 'localhost 대상은 진단할 수 없습니다.' };
  }

  if (isBlockedIpv4(hostname)) {
    return { ok: false, reason: '내부망 또는 사설 네트워크 대상은 진단할 수 없습니다.' };
  }

  return { ok: true, url: parsed.toString(), hostname };
}

function normalizeUrlInput(input) {
  const value = String(input || '').trim();
  if (/^[a-z][a-z\d+.-]*:/i.test(value)) return value;
  return `https://${value}`;
}

function isBlockedIpv4(hostname) {
  const parts = hostname.split('.');
  if (parts.length !== 4) return false;

  const octets = parts.map((part) => Number(part));
  if (octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = octets;

  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    a === 0
  );
}
