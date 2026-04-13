'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';

interface DistanceInfo {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  status: string;
}

interface Parking {
  _id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
}

interface ApiResponse {
  parking?: Parking | null;
  distanceInfo?: DistanceInfo;
  error?: string;
}

const containerStyle = {
  width: '100%',
  height: '360px',
  borderRadius: '16px',
  boxShadow: '0 6px 18px rgba(17,24,39,0.08)',
  marginTop: '1.5rem',
};

const centerDefault = {
  lat: -34.6037,
  lng: -58.3816,
};

export default function ClosestParking() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos({ lat: latitude, lng: longitude });

        try {
          const res = await fetch(`/api/parking/closest-parking?lat=${latitude}&lng=${longitude}`);
          const json = await res.json();
          setData(json);
        } catch {
          setData({ error: 'Error consultando la API' });
        } finally {
          setLoading(false);
        }
      },
      () => {
        setUserPos(centerDefault);
        setLoading(false);
      }
    );
  }, []);

  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    map.controls[google.maps.ControlPosition.TOP_RIGHT].clear();
    if (buttonRef.current) {
      map.controls[google.maps.ControlPosition.TOP_RIGHT].push(buttonRef.current);
    }
  };

  const centerMapOnUser = () => {
    if (mapRef.current && userPos) {
      mapRef.current.panTo(userPos);
      mapRef.current.setZoom(14);
    }
  };

  const userIcon = useMemo(() => {
    if (!isLoaded) return undefined;
    return {
      url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      scaledSize: new window.google.maps.Size(44, 44),
    };
  }, [isLoaded]);

  const parkingIcon = useMemo(() => {
    if (!isLoaded) return undefined;
    return {
      url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
      scaledSize: new window.google.maps.Size(44, 44),
    };
  }, [isLoaded]);

  if (loading || !isLoaded) {
    return (
      <div className="dashboard-section mx-auto max-w-3xl p-6 md:p-8">
        <div className="mb-6 space-y-3 animate-pulse">
          <div className="h-8 w-56 rounded bg-gray-200"></div>
          <div className="h-6 w-40 rounded bg-gray-200"></div>
          <div className="h-6 w-44 rounded bg-gray-200"></div>
          <div className="h-5 w-64 rounded bg-gray-100"></div>
        </div>
        <div style={containerStyle} className="rounded-2xl bg-gray-200 animate-pulse" />
      </div>
    );
  }

  if (data?.error) return <p className="mx-auto max-w-xl py-8 text-center text-sm font-semibold text-red-700">{data.error}</p>;
  if (!data?.parking || !data?.distanceInfo) return <p className="mx-auto max-w-xl py-8 text-center text-sm text-gray-600">No se encontró ninguna playa cercana</p>;
  if (loadError) return <p className="mx-auto max-w-xl py-8 text-center text-sm font-semibold text-red-700">Error cargando el mapa</p>;

  const parking = data.parking;
  const distanceInfo = data.distanceInfo;

  return (
    <div className="dashboard-section mx-auto max-w-3xl p-6 md:p-8">
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Playa más cercana</h2>
        <p className="mt-2 text-sm text-gray-500">Ubicación estimada y referencia de tiempo/distancia.</p>
      </div>

      <div className="space-y-3 mb-6">
        <p className="text-2xl font-bold text-gray-900">{parking.name}</p>
        <p className="text-base text-gray-700">Distancia: <span className="font-semibold">{distanceInfo.distance.text}</span></p>
        <p className="text-base text-gray-700">Tiempo estimado: <span className="font-semibold">{distanceInfo.duration.text}</span></p>
        {parking.location.address ? <p className="text-sm italic text-gray-500">{parking.location.address}</p> : null}
      </div>

      <button
        ref={buttonRef}
        onClick={centerMapOnUser}
        disabled={!userPos}
        className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        title="Centrar en mi ubicación"
        style={{ display: 'none' }}
      >
        Centrar en mi ubicación
      </button>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={userPos || centerDefault}
        zoom={14}
        onLoad={onMapLoad}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ],
        }}
      >
        {userPos ? <Marker position={userPos} icon={userIcon} title="Tu ubicación" /> : null}

        {parking.location ? (
          <Marker
            position={{ lat: parking.location.lat, lng: parking.location.lng }}
            icon={parkingIcon}
            title={parking.name}
            onClick={() => {
              const url = `https://www.google.com/maps/search/?api=1&query=${parking.location.lat},${parking.location.lng}`;
              window.open(url, '_blank');
            }}
          />
        ) : null}
      </GoogleMap>
    </div>
  );
}
