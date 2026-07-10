export interface Property {
  propertyId: string;
  sellerId: string;
  title: string;
  description: string;
  city?: string;
  state?: string;
  salePrice?: number;
  type: 'apartment' | 'house' | 'villa' | 'plot' | 'commercial';
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  location: PropertyLocation;
  amenities: string[];
  images: string[];
  videos: string[];
  verificationStatus: 'pending' | 'approved' | 'rejected';
  isAuctionRequested: boolean;
  viewCount: number;
  interestedBuyers: string[];
  createdAt: string;
}

export interface PropertyLocation {
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  geohash: string;
}

export interface PropertyFilters {
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  status?: string;
  amenities?: string[];
  sortBy?: string;
}
