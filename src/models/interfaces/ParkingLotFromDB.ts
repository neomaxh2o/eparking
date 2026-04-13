// Interface para tipar un parking lot traído desde la base de datos
export interface ParkingLotFromDB {
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
