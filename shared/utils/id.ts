export function createId(date: Date = new Date()) {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  const timestamp = BigInt(date.getTime());
  const byteMask = BigInt(0xff);
  bytes[0] = Number((timestamp >> BigInt(40)) & byteMask);
  bytes[1] = Number((timestamp >> BigInt(32)) & byteMask);
  bytes[2] = Number((timestamp >> BigInt(24)) & byteMask);
  bytes[3] = Number((timestamp >> BigInt(16)) & byteMask);
  bytes[4] = Number((timestamp >> BigInt(8)) & byteMask);
  bytes[5] = Number(timestamp & byteMask);
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}
