function normalizeCajaNumber(input) {
  const n = Number(input);
  if (!Number.isFinite(n) || Number.isNaN(n) || n <= 0) return null;
  return Math.trunc(n);
}

function toCurrencyCents(amountFloating) {
  const n = typeof amountFloating === 'string' ? Number(amountFloating) : amountFloating;
  if (!Number.isFinite(n) || Number.isNaN(n)) throw new Error('invalid amount');
  return Math.round(n * 100);
}

module.exports = { normalizeCajaNumber, toCurrencyCents };
