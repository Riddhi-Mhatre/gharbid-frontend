import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProperties } from '../services/propertyService';
import { useFilterStore } from '../store/filterStore';
import { PropertyGrid } from '../components/properties/PropertyGrid';
import { PropertyFilters } from '../components/properties/PropertyFilters';
import { PropertyMap } from '../components/properties/PropertyMap';
import { Map, List, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PropertyListPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const filters = useFilterStore();
  const navigate = useNavigate();

  const queryFilters = useMemo(() => ({
    status: 'approved',
    type: filters.propertyType || undefined,
    minPrice: filters.priceRange[0],
    maxPrice: filters.priceRange[1] < 100_000_000 ? filters.priceRange[1] : undefined,
    amenities: filters.amenities.length ? filters.amenities : undefined,
    sortBy: filters.sortBy,
  }), [filters]);

  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties', queryFilters],
    queryFn: () => getProperties(queryFilters),
  });

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Discover Properties</h1>
            <p className="text-muted mt-1">Verified real estate with transparent pricing</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="md:hidden btn-ghost border border-dark-border"
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            >
              <SlidersHorizontal size={18} />
            </button>
            <div className="flex bg-dark-hover rounded-lg p-1 border border-dark-border">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary text-black' : 'text-muted hover:text-white'}`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'map' ? 'bg-primary text-black' : 'text-muted hover:text-white'}`}
              >
                <Map size={18} />
              </button>
            </div>
            <select
              value={filters.sortBy}
              onChange={(e) => filters.setSortBy(e.target.value as any)}
              className="bg-dark-hover border border-dark-border text-sm rounded-lg px-3 py-2 outline-none focus:border-primary"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 relative">
          {/* Filters Sidebar */}
          <div className={`md:w-64 shrink-0 ${showFiltersMobile ? 'block fixed inset-0 z-50 bg-dark-card p-6 overflow-y-auto' : 'hidden md:block'}`}>
            {showFiltersMobile && (
              <button className="absolute top-4 right-4 text-muted" onClick={() => setShowFiltersMobile(false)}>Close</button>
            )}
            <div className="sticky top-24">
              <PropertyFilters />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {viewMode === 'grid' ? (
              <PropertyGrid properties={properties || []} loading={isLoading} />
            ) : (
              <div className="sticky top-24 h-[calc(100vh-8rem)]">
                <PropertyMap properties={properties || []} onPropertyClick={(id) => {
                  const basePath = window.location.pathname.startsWith('/buyer') ? '/buyer/properties' : '/properties';
                  navigate(`${basePath}/${id}`);
                }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
