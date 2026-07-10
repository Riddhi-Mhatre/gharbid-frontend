import { useState, useEffect } from 'react';
import { useFilterStore } from '../../store/filterStore';
import { PROPERTY_TYPES, AMENITIES } from '../../utils/constants';
import { formatShortPrice } from '../../utils/formatters';

export const PropertyFilters = () => {
  const { propertyType, priceRange, amenities, setPropertyType, setPriceRange, setAmenities, reset } = useFilterStore();

  const [localMaxPrice, setLocalMaxPrice] = useState(priceRange[1]);

  // Sync external changes (like reset) to local state
  useEffect(() => {
    setLocalMaxPrice(priceRange[1]);
  }, [priceRange[1]]);

  // Debounce pushing local state to the global store
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localMaxPrice !== priceRange[1]) {
        setPriceRange([priceRange[0], localMaxPrice]);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [localMaxPrice, priceRange, setPriceRange]);

  return (
    <aside className="w-full space-y-6" aria-label="Property Filters">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        <button onClick={reset} className="text-xs text-primary hover:underline" id="filter-reset">Reset all</button>
      </div>

      {/* Property Type */}
      <div>
        <label className="text-xs text-muted font-medium uppercase tracking-wide mb-2 block">Type</label>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map(type => (
            <button
              key={type.value}
              id={`filter-type-${type.value}`}
              onClick={() => setPropertyType(propertyType === type.value ? '' : type.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                propertyType === type.value
                  ? 'bg-primary text-black'
                  : 'bg-dark-hover text-muted hover:text-white border border-dark-border'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="text-xs text-muted font-medium uppercase tracking-wide mb-2 block">
          Price: {formatShortPrice(priceRange[0])} – {formatShortPrice(localMaxPrice)}
        </label>
        <input
          type="range"
          id="filter-price-max"
          min={0}
          max={100_000_000}
          step={500_000}
          value={localMaxPrice}
          onChange={(e) => setLocalMaxPrice(Number(e.target.value))}
          className="w-full accent-primary"
          aria-label="Maximum price"
        />
      </div>

      {/* Amenities */}
      <div>
        <label className="text-xs text-muted font-medium uppercase tracking-wide mb-2 block">Amenities</label>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.slice(0, 8).map(a => (
            <button
              key={a}
              id={`filter-amenity-${a}`}
              onClick={() => setAmenities(amenities.includes(a) ? amenities.filter(x => x !== a) : [...amenities, a])}
              className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                amenities.includes(a)
                  ? 'bg-secondary/20 text-secondary border border-secondary/30'
                  : 'bg-dark-hover text-muted hover:text-white border border-dark-border'
              }`}
            >
              {a.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
