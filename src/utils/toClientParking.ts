export interface ClientParking {
  _id: string;
  name: string;
  location: {
    address: string;
    [key: string]: any;
  };
  [key: string]: any;
}

function normalizeId(value: any): string {
  if (!value) return '';

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'object' && typeof value.$oid === 'string') {
    return value.$oid.trim();
  }

  if (typeof value?.toString === 'function') {
    const parsed = value.toString();
    if (parsed && parsed !== '[object Object]') {
      return parsed.trim();
    }
  }

  return '';
}

export function toClientParking(doc: any): ClientParking {
  return {
    ...doc,
    _id: normalizeId(doc?._id ?? doc?.id),
    name: doc?.name ?? '',
    location: {
      ...(doc?.location ?? {}),
      address: doc?.location?.address ?? '',
    },
  };
}

export function toClientParkingArray(docs: any[] = []): ClientParking[] {
  return docs.map(toClientParking).filter((p) => p._id !== '');
}
