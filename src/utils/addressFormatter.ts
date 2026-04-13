// utils/addressFormatter.ts
export function formatAddress(rawAddress: string): string {
  if (!rawAddress) return '';
  return rawAddress.split(',')[0].trim();
}
