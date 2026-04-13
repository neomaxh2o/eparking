#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[error] No existe $ENV_FILE"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[error] node no está instalado o no está en PATH"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

if [[ -z "${MONGODB_URI:-}" ]]; then
  echo "[error] MONGODB_URI no está definido en $ENV_FILE"
  exit 1
fi

echo "[info] Workspace: $ROOT_DIR"
echo "[warn] Esta limpieza es DESTRUCTIVA sobre staging y NO genera backup."
echo "[warn] Conserva users y purga playas/abonados/facturación/cajas/tickets/reportes."
read -r -p "Escribe RESET STAGING SIN BACKUP para continuar: " CONFIRM

if [[ "$CONFIRM" != "RESET STAGING SIN BACKUP" ]]; then
  echo "[abort] Confirmación inválida. No se realizó ninguna limpieza."
  exit 1
fi

echo "[step] Ejecutando limpieza de staging sin backup..."
node <<'EOF'
const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI no definido');

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const collectionsToDeleteAll = [
    'parkinglots',
    'parkings',
    'plazas',
    'tarifas',
    'tickets',
    'turnos',
    'turnoreports',
    'billingclosures',
    'abonadoinvoices',
    'abonados',
    'abonos',
    'estadias',
    'reservations',
    'novedads'
  ];

  const report = {};

  for (const name of collectionsToDeleteAll) {
    const exists = await db.listCollections({ name }).hasNext();
    if (!exists) {
      report[name] = { deleted: 0, skipped: true };
      continue;
    }

    const result = await db.collection(name).deleteMany({});
    report[name] = { deleted: result.deletedCount };
  }

  const usersExists = await db.listCollections({ name: 'users' }).hasNext();
  if (usersExists) {
    const result = await db.collection('users').updateMany(
      {},
      {
        $set: { assignedParking: null },
        $unset: { assignedParkingId: '' }
      }
    );

    report.users = {
      preserved: true,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      assignedParkingCleared: true
    };
  } else {
    report.users = { preserved: false, skipped: true };
  }

  const countersExists = await db.listCollections({ name: 'counters' }).hasNext();
  if (countersExists) {
    const result = await db.collection('counters').deleteMany({
      _id: {
        $in: [
          'abonado_numero',
          'billing_document',
          'billing_closure',
          'turno_numero',
          'ticket_number'
        ]
      }
    });

    report.counters = {
      partialReset: true,
      deleted: result.deletedCount
    };
  } else {
    report.counters = { skipped: true };
  }

  console.log(JSON.stringify(report, null, 2));
  await client.close();
}

main().catch((error) => {
  console.error('[fatal]', error);
  process.exit(1);
});
EOF

echo "[done] Limpieza finalizada sin backup."
