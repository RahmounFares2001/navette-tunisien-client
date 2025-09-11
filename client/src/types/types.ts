import { Types } from 'mongoose';

// Excursion Request Interface
export interface IExcursionRequest {
  _id?: Types.ObjectId;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  excursionDate: Date;
  excursionTime: string;
  numberOfAdults: number;
  numberOfChildren: number;
  numberOfBabies: number;
  message?: string;
  price: number;
  withGuide: boolean;
  driverLanguages: string;
  status: 'pending' | 'confirmed' | 'completed';
  paymentPercentage: 0 | 100;
  excursionId: Types.ObjectId;
  createdAt: Date;
}

// Excursion Interface
export interface IExcursion {
  _id?: Types.ObjectId;
  title: string;
  description: string;
  includedItems: string[];
  dailyProgram: string[];
  prices: {
    oneToFour: number;
    fiveToSix: number;
    sevenToEight: number;
  };
  isAvailable: boolean;
  duration: number;
  imageUrls: string[];
  createdAt?: Date;
}

// Transfer Interface
export interface ITransfer {
  _id?: Types.ObjectId;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  tripType: 'aller simple' | 'aller retour';
  departureLocation: string;
  departureAddress?: string;
  destination: string;
  destinationAddress: string;
  travelDate: Date;
  departureTime: string;
  returnDate: string;
  returnTime: string;
  flightNumber?: string;
  numberOfAdults: number;
  numberOfChildren: number;
  driverLanguage: string[];
  comment?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'rejected';
  vehicleId: Types.ObjectId;
  price: number;
  paymentPercentage: 0 | 100;
  createdAt: Date;
}

// Vehicle Interface
export interface IVehicle {
  _id?: Types.ObjectId;
  name: string;
  numberOfSeats: number;
  pricePerKm: number;
  numberOfSuitcases: number;
  imgUrl: string;
  isAvailable: boolean;
  createdAt: Date;
}

// Dashboard Data Interface
export interface IDashboardData {
  stats: {
    title: string;
    value: string;
    icon: string;
  }[];
  recentActivities: {
    type: 'transfer' | 'excursion';
    message: string;
    time: string;
    status: 'pending' | 'confirmed' | 'completed';
  }[];
}

// Request Interfaces
export interface ListParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'confirmed' | 'completed' | 'rejected';
  paymentPercentage?: 0 | 100;
  search: string;
}

export interface CreateTransferRequest {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  tripType: 'aller simple' | 'aller retour';
  departureLocation: string;
  departureAddress?: string;
  destination: string;
  destinationAddress?: string;
  travelDate: string;
  departureTime: string;
  returnDate: string;
  returnTime: string;
  flightNumber?: string;
  numberOfAdults: number;
  numberOfChildren?: number;
  numberOfSuitcases?: number;
  driverLanguage?: string[];
  comment?: string;
  vehicleId: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'rejected';
  paymentPercentage?: 0 | 100;
}

export interface UpdateTransferRequest {
  id: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  tripType?: 'aller simple' | 'aller retour';
  departureLocation?: string;
  departureAddress?: string;
  destination?: string;
  destinationAddress?: string;
  travelDate?: string;
  departureTime?: string;
  returnDate: string;
  returnTime: string;
  flightNumber?: string;
  numberOfAdults?: number;
  numberOfChildren?: number;
  numberOfSuitcases?: number;
  driverLanguage?: string[];
  comment?: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'rejected';
  paymentPercentage?: 0 | 100;
  vehicleId?: string;
}

export interface CreateExcursionRequest {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  excursionDate: string;
  excursionTime: string;
  numberOfAdults: number;
  numberOfChildren: number;
  numberOfBabies: number;
  withGuide: boolean;
  driverLanguages: string;
  message?: string;
  excursionId: string;
  paymentPercentage?: 0 | 100;
}

export interface UpdateExcursionRequest {
  id: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  excursionDate?: string;
  excursionTime?: string;
  numberOfAdults?: number;
  numberOfChildren?: number;
  numberOfBabies?: number;
  withGuide?: boolean;
  message?: string;
  excursionId?: string;
  status?: 'pending' | 'confirmed' | 'completed';
  paymentPercentage?: 0 | 100;
}

export interface CreateExcursion {
  title: string;
  description: string;
  includedItems: string[];
  dailyProgram: string[];
  prices: {
    oneToFour: number;
    fiveToSix: number;
    sevenToEight: number;
  };
  isAvailable?: boolean;
  duration: number;
  imageUrls?: string[];
}

export interface UpdateExcursion {
  id: string;
  title?: string;
  description?: string;
  includedItems?: string[];
  dailyProgram?: string[];
  prices?: {
    oneToFour: number;
    fiveToSix: number;
    sevenToEight: number;
  };
  isAvailable?: boolean;
  duration?: number;
  imageUrls?: string[];
}

// Response Interfaces
export interface IVehicleResponse {
  _id: string;
  name: string;
  numberOfSeats: number;
  pricePerKm: number;
  numberOfSuitcases: number;
  imgUrl: string;
  isAvailable: boolean;
  createdAt: string;
}

export interface ITransferResponse {
  _id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  tripType: 'aller simple' | 'aller retour';
  departureLocation: string;
  departureAddress?: string;
  destination: string;
  destinationAddress: string;
  travelDate: string;
  departureTime: string;
  returnDate: string;
  returnTime: string;
  flightNumber?: string;
  numberOfAdults: number;
  numberOfChildren?: number;
  driverLanguage?: string[];
  price: number;
  comment?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'rejected';
  paymentPercentage: 0 | 100;
  vehicleId: IVehicleResponse;
  createdAt: string;
}

export interface IExcursionResponse {
  _id: string;
  title: string;
  description: string;
  includedItems: string[];
  dailyProgram: string[];
  prices: {
    oneToFour: number;
    fiveToSix: number;
    sevenToEight: number;
  };
  isAvailable: boolean;
  duration: number;
  imageUrls: string[];
  createdAt?: string;
}

export interface IExcursionRequestResponse {
  _id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  excursionDate: string;
  excursionTime: string;
  numberOfAdults: number;
  numberOfChildren: number;
  numberOfBabies: number;
  withGuide: boolean;
  driverLanguages: string;
  message?: string;
  excursionId: IExcursionResponse;
  status: 'pending' | 'confirmed' | 'completed';
  price: number;
  paymentPercentage: 0 | 100;
  createdAt: string;
}

export interface CreateVehicleRequest {
  name: string;
  numberOfSeats: number;
  numberOfSuitcases: number;
  pricePerKm: number;
  imgUrl: string;
  isAvailable: boolean;
}

export interface UpdateVehicleRequest {
  name: string;
  numberOfSeats: number;
  numberOfSuitcases: number;
  pricePerKm: number;
  imgUrl?: string;
  isAvailable: boolean;
}