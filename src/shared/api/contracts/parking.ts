export type ParkingDto = {
  id: string;
  _id?: string;
  code?: string;
  name: string;
  owner?: string;
  location?: {
    address: string;
    lat: number;
    lng: number;
  };
  totalSpots?: number;
  availableSpots?: number;
  pricePerHour?: number;
  schedule?: {
    open: string;
    close: string;
  };
  isAvailable?: boolean;
  tarifas?: unknown[];
};

export type ParkingListResponse = ParkingDto[];

export type CreateParkingInput = {
name: string;
owner: string;
location: {
address: string;
lat: number;
lng: number;
};
totalSpots: number;
availableSpots: number;
pricePerHour: number;
schedule: {
open: string;
close: string;
};
};

export type CreateParkingResponse = {
message: string;
parkingLot?: ParkingDto;
};
