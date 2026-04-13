import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import ParkingLot from '@/models/ParkingLot';
import axios from 'axios';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Faltan coordenadas' }, { status: 400 });
    }

    console.log('Latitud:', lat, 'Longitud:', lng);

    // Conecta a la base de datos
    await connectToDatabase();

    // Trae todas las playas registradas
    const parkings = await ParkingLot.find();

    if (parkings.length === 0) {
      return NextResponse.json({ error: 'No hay playas registradas' }, { status: 404 });
    }

    // Prepara destinos para Google Distance Matrix
    const destinations = parkings.map(p => `${p.location.lat},${p.location.lng}`);

    console.log('Destinos enviados a Google Distance Matrix:', destinations);

    // Llama a la API de Google con la variable correcta
    const googleRes = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: `${lat},${lng}`,
        destinations: destinations.join('|'),
        key: process.env.GOOGLE_MAPS_API_KEY, // <-- clave servidor
      }
    });

    console.log('Respuesta de Google Distance Matrix:', googleRes.data);

    const elements = googleRes.data.rows[0].elements;

    let closestIndex = -1;
    let minDistanceValue = Infinity;

    // Busca el más cercano con status OK y la distancia mínima
    elements.forEach((el: any, idx: number) => {
      if (el.status === 'OK' && el.distance.value < minDistanceValue) {
        minDistanceValue = el.distance.value;
        closestIndex = idx;
      }
    });

    if (closestIndex === -1) {
      return NextResponse.json({ error: 'No se pudo determinar la playa más cercana' }, { status: 404 });
    }

    const closestParking = parkings[closestIndex];
    const closestDistanceData = elements[closestIndex];

    return NextResponse.json({
      parking: closestParking,
      distanceInfo: closestDistanceData,
    });
  } catch (error) {
    console.error('Error en API closest-parking:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
