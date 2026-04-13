// Interface para usar en el frontend/context
export interface ParkingLotContext {
  _id: string;
  owner: string; // id del dueño
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  totalSpots: number;
  availableSpots: number;
  pricePerHour: number;
  schedule: {
    open: string;
    close: string;
  };
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}