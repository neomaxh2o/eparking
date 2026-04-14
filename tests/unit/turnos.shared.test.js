const assert = require('assert');
const { normalizeCajaNumber, toCurrencyCents } = require('../../src/modules/turnos/shared');

try {
  assert.strictEqual(normalizeCajaNumber('5'), 5);
  assert.strictEqual(normalizeCajaNumber(3.9), 3);
  assert.strictEqual(normalizeCajaNumber(null), null);
  assert.strictEqual(toCurrencyCents(12.34), 1234);
  assert.strictEqual(toCurrencyCents('0.1'), 10);
  console.log('OK');
  process.exit(0);
} catch (e) {
  console.error('FAIL', e && e.message);
  process.exit(2);
}
