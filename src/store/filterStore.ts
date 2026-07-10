import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FilterState {
  priceRange: [number, number];
  propertyType: string;
  amenities: string[];
  sortBy: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  city: string;
  setPriceRange: (range: [number, number]) => void;
  setPropertyType: (type: string) => void;
  setAmenities: (amenities: string[]) => void;
  setSortBy: (sort: FilterState['sortBy']) => void;
  setCity: (city: string) => void;
  reset: () => void;
}

const defaults = {
  priceRange: [0, 100_000_000] as [number, number],
  propertyType: '',
  amenities: [],
  sortBy: 'newest' as const,
  city: '',
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      ...defaults,
      setPriceRange: (range) => set({ priceRange: range }),
      setPropertyType: (type) => set({ propertyType: type }),
      setAmenities: (amenities) => set({ amenities }),
      setSortBy: (sort) => set({ sortBy: sort }),
      setCity: (city) => set({ city }),
      reset: () => set(defaults),
    }),
    { name: 'gharbid-filters' }
  )
);
