export function findTags(html, tagName) {
  const pattern = new RegExp(`<${escapeRegExp(tagName)}\\b[^>]*>`, 'gi');
  return String(html || '').match(pattern) || [];
}

export function attr(tag, name) {
  return attributesFor(tag).get(String(name || '').toLowerCase());
}

function attributesFor(tag) {
  const attributes = new Map();
  const source = String(tag || '')
    .replace(/^<\s*\/?\s*[^\s/>]+/, '')
    .replace(/\/?>\s*$/, '');
  const pattern = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    const name = String(match[1] || '').toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    attributes.set(name, value);
  }

  return attributes;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
