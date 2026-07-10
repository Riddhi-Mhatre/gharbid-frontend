export const API_BASE = import.meta.env.VITE_API_BASE_URL;
export const WS_URL = import.meta.env.VITE_WS_URL;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY: '/verify',
  PROPERTIES: '/properties',
  PROPERTY_DETAIL: (id: string) => `/properties/${id}`,
  AUCTION: (id: string) => `/auctions/${id}`,
  BUYER_DASHBOARD: '/buyer/dashboard',
  BUYER_AUCTIONS: '/buyer/auctions',
  BUYER_BIDS: '/buyer/bids',
  BUYER_SAVED: '/buyer/saved',
  BUYER_LEGAL: '/buyer/legal-documents',
  BUYER_PURCHASES: '/buyer/purchases',
  BUYER_PROFILE: '/buyer/profile',
  SELLER_DASHBOARD: '/seller/dashboard',
  CHAT: '/chat',
  PROFILE: '/profile',
} as const;

export const AMENITIES = [
  'parking', 'gym', 'swimming_pool', 'security', 'elevator',
  'power_backup', 'water_supply', 'garden', 'clubhouse', 'wifi',
];

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'plot', label: 'Plot' },
  { value: 'commercial', label: 'Commercial' },
];
