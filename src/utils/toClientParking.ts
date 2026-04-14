export interface ClientParking {
  _id: string;
  name: string;
  location: {
    address: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function normalizeId(value: unknown): string {
  if (value === null || value === undefined) return '';

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'object' && value !== null) {
    // mongodb ObjectId representation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vAny = value as any;
    if (typeof vAny.$oid === 'string') return vAny.$oid.trim();
    if (typeof vAny.toString === 'function') {
      const parsed = String(vAny.toString());
      if (parsed && parsed !== '[object Object]') return parsed.trim();
    }
  }

  return '';
}

export function toClientParking(doc: unknown): ClientParking {
  const d = (doc && typeof doc === 'object') ? (doc as Record<string, unknown>) : {};
  const id = normalizeId(d?._id ?? d?.id);
  const name = typeof d?.name === 'string' ? d.name : '';
  const locationRaw = d?.location && typeof d.location === 'object' ? (d.location as Record<string, unknown>) : {};
  const address = typeof locationRaw.address === 'string' ? locationRaw.address : '';

  return {
    ...d,
    _id: id,
    name,
    location: {
      ...locationRaw,
      address,
    },
  } as ClientParking;
}

export function toClientParkingArray(docs: unknown[] = []): ClientParking[] {
  if (!Array.isArray(docs)) return [];
  return docs.map((x) => toClientParking(x)).filter((p) => p._id !== '');
}
