import { Tarifa } from './tarifa';

export interface Parking {
  _id: string;
  name: string;
  pricePerHour: number;
  schedule: {
    open: string;
    close: string;
  };
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  totalSpots: number;
  availableSpots: number;
  isAvailable?: boolean;
  specialRates?: {
    label: string;
    price: number;
  }[];
  tarifas?: Tarifa[];
  owner: string | {
    _id: string;
    name?: string;
    email?: string;
  };
}
