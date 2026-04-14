// pages/api/estadias/activas.ts
import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '@/lib/mongoose';
import Estadia from '@/models/Estadia';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    const estadiasActivas = await Estadia.find({ estado: 'activa' }).sort({ createdAt: -1 }).lean<Record<string, unknown>[]>();
    return res.status(200).json(estadiasActivas);
  } catch (err: unknown) {
    console.error('Error API /estadias/activas:', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'error interno' });
  }
}
