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

    const estadiasActivas = await Estadia.find({ estado: 'activa' }).sort({ createdAt: -1 });
    return res.status(200).json(estadiasActivas);
  } catch (err: any) {
    console.error('Error API /estadias/activas:', err);
    return res.status(500).json({ error: err.message });
  }
}
