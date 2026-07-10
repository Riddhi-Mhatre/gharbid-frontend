import type { Property } from '../../types/property.types';
import { PropertyCard } from './PropertyCard';
import { Loader } from '../common/Loader';
import { Building2 } from 'lucide-react';

interface PropertyGridProps {
  properties: Property[];
  loading?: boolean;
}

export const PropertyGrid = ({ properties, loading }: PropertyGridProps) => {
  if (loading) return <Loader label="Loading properties..." />;

  if (!properties.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <Building2 size={48} className="text-muted" />
        <p className="text-muted">No properties found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {properties.map((property) => (
        <PropertyCard key={property.propertyId} property={property} />
      ))}
    </div>
  );
};
