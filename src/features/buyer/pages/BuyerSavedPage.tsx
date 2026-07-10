import { Heart, Scale, X, Check } from 'lucide-react';
import { BuyerPropertyCard } from '../../../components/properties/BuyerPropertyCard';
import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { getSavedProperties } from '../../../services/userService';
import { Loader2 } from 'lucide-react';

export default function BuyerSavedPage() {
  const { data: savedItems = [], isLoading } = useQuery({
    queryKey: ['savedProperties'],
    queryFn: getSavedProperties,
  });

  const savedProperties = savedItems.map((item: any) => item.property || item.propertySnapshot).filter(Boolean);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center justify-between border-b border-dark-border pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-lg">
            <Heart size={28} className="text-rose-500" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-black uppercase tracking-widest text-white">Saved Properties</h1>
            <p className="text-muted text-sm mt-1">Properties you've liked and saved for later.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedProperties.length === 0 ? (
          <div className="col-span-full text-center text-muted py-12">
            No saved properties found.
          </div>
        ) : (
          savedProperties.map((property: any) => (
            <BuyerPropertyCard key={property.propertyId} property={property} />
          ))
        )}
      </div>
    </div>
  );
}
