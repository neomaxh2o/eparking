function stripDiacritics(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeShortCode(value: string) {
  return stripDiacritics(String(value || ''))
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 6);
}

export function generateParkingShortCode(name: string) {
  const words = stripDiacritics(String(name || ''))
    .toUpperCase()
    .replace(/[^A-Z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return 'PARK';
  if (words.length === 1) return normalizeShortCode(words[0]).slice(0, 6) || 'PARK';

  const composite = `${words[0].slice(0, 2)}${words[1].slice(0, 2)}${words[2]?.slice(0, 2) ?? ''}`;
  return normalizeShortCode(composite) || 'PARK';
}

export function buildCajaCode(shortCode: string, numero: number) {
  const prefix = normalizeShortCode(shortCode) || 'PARK';
  return `${prefix}-${String(Number(numero || 0)).padStart(3, '0')}`;
}
