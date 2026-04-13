'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface LocationPickerProps {
  location: Location;
  onLocationChange: (location: Location) => void;
}

// Estilo del mapa
const mapContainerStyle = {
  width: '100%',
  height: '300px',
};

// Coordenadas de Córdoba, Argentina por defecto
const centerCordoba = {
  lat: -31.4201,
  lng: -64.1888,
};

export default function LocationPicker({ location, onLocationChange }: LocationPickerProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number }>({
    lat: location.lat || centerCordoba.lat,
    lng: location.lng || centerCordoba.lng,
  });

  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(markerPosition);

  useEffect(() => {
    if (location.lat === 0 && location.lng === 0) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setMarkerPosition({ lat, lng });
            setMapCenter({ lat, lng });
            reverseGeocode(lat, lng);
          },
          () => {
            setMarkerPosition(centerCordoba);
            setMapCenter(centerCordoba);
            reverseGeocode(centerCordoba.lat, centerCordoba.lng);
          }
        );
      } else {
        setMarkerPosition(centerCordoba);
        setMapCenter(centerCordoba);
        reverseGeocode(centerCordoba.lat, centerCordoba.lng);
      }
    } else {
      setMarkerPosition({ lat: location.lat, lng: location.lng });
      setMapCenter({ lat: location.lat, lng: location.lng });
      reverseGeocode(location.lat, location.lng);
    }
  }, [location.lat, location.lng]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          latlng: `${lat},${lng}`,
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      });
      if (res.data.status === 'OK' && res.data.results.length > 0) {
        const address = res.data.results[0].formatted_address;
        onLocationChange({ lat, lng, address });
      } else {
        onLocationChange({ lat, lng, address: '' });
      }
    } catch {
      onLocationChange({ lat, lng, address: '' });
    }
  };

  const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPosition({ lat, lng });
    reverseGeocode(lat, lng);
  };

  const onMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPosition({ lat, lng });
    reverseGeocode(lat, lng);
  };

  if (loadError) return <div>Error cargando el mapa</div>;
  if (!isLoaded) return <div>Cargando mapa...</div>;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      zoom={14}
      center={mapCenter}
      onClick={onMapClick}
    >
      <Marker
        position={markerPosition}
        draggable={true}
        onDragEnd={onMarkerDragEnd}
      />
    </GoogleMap>
  );
}
