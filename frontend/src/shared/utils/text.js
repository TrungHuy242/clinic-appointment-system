const CP1252_BYTE_MAP = new Map([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
]);

const MOJIBAKE_SEGMENT_PATTERN = /[\u00A0-\u00FF\u0152\u0153\u0160\u0161\u0178\u0192\u02C6\u02DC\u2013\u2014\u2018-\u201A\u201C-\u201E\u2020-\u2022\u2026\u2030\u2039\u203A\u20AC\u2122]{2,}/g;

const utf8Decoder =
  typeof TextDecoder !== "undefined" ? new TextDecoder("utf-8", { fatal: false }) : null;

function toCp1252Bytes(value) {
  const bytes = [];

  for (const char of value) {
    const codePoint = char.codePointAt(0);

    if (codePoint <= 0x7f || (codePoint >= 0xa0 && codePoint <= 0xff)) {
      bytes.push(codePoint);
      continue;
    }

    const mappedByte = CP1252_BYTE_MAP.get(codePoint);
    if (mappedByte === undefined) {
      return null;
    }

    bytes.push(mappedByte);
  }

  return Uint8Array.from(bytes);
}

function decodeCp1252AsUtf8(value) {
  if (!utf8Decoder) return value;
  const bytes = toCp1252Bytes(value);
  if (!bytes) return value;

  try {
    return utf8Decoder.decode(bytes) || value;
  } catch {
    return value;
  }
}

export function repairMojibakeText(value) {
  if (typeof value !== "string") {
    return value;
  }

  let current = value;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const next = current.replace(MOJIBAKE_SEGMENT_PATTERN, (segment) => decodeCp1252AsUtf8(segment));
    if (next === current) break;
    current = next;
  }

  return current;
}

export function repairMojibakeDeep(value) {
  if (Array.isArray(value)) {
    return value.map(repairMojibakeDeep);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, repairMojibakeDeep(nestedValue)])
    );
  }

  return repairMojibakeText(value);
}
