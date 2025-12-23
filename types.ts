
export enum PlaceType {
  RESTAURANT = 'Ristorante',
  HOTEL = 'Hotel',
  OTHER = 'Esperienze'
}

export const HOTEL_AMENITIES = [
    "Parcheggio Gratis", 
    "Parcheggio a Pagamento", 
    "WiFi", 
    "Palestra",
    "Piscina", 
    "Spa", 
    "Ristorante Interno", 
    "Colazione Inclusa",
    "Meeting Room", 
    "Pet Friendly", 
    "Bar / Lounge",
    "Navetta Aeroporto",
    "Servizio in Camera",
    "Reception 24h"
];

export interface BusinessCard {
  id: string;
  userId: string;
  name: string;
  type: PlaceType;
  address: string;
  phone: string;
  website: string;
  email: string;
  tags: string[];
  services?: string[]; // New field for Hotel amenities
  bipConvention?: boolean; // New field for Bip Convention
  notes: string;
  rating: number; // 1-5
  averageCost?: number;
  imageFront?: string; // Base64 (Optional now)
  imageBack?: string; // Base64
  createdAt: number;
  lat?: number;
  lng?: number;
  likedBy: string[]; // Array of User IDs who liked this card
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}