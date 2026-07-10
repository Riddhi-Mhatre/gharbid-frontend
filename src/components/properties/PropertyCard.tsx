import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, MapPin, Bed, Bath, Square } from 'lucide-react';
import type { Property } from '../../types/property.types';
import { formatShortPrice } from '../../utils/formatters';
import { ROUTES } from '../../utils/constants';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSavedProperties, saveProperty, removeSavedProperty } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  featured?: boolean;
}

export const PropertyCard = ({ property, featured }: PropertyCardProps) => {
  const isVerified =
    property.verificationStatus === 'approved' ||
    (property.verificationStatus as string) === 'verified' ||
    (property as any).status === 'approved';

  // Support both nested location object and flat city/state fields
  const city  = property.location?.city  ?? (property as any).city  ?? '';
  const state = property.location?.state ?? (property as any).state ?? '';
  const price = property.price ?? (property as any).salePrice ?? (property as any).rentPrice ?? 0;
  const area  = property.area  ?? (property as any).areasqft ?? 0;

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isBuyer = user?.role === 'buyer';
  const location = useLocation();

  const detailUrl = location.pathname.startsWith('/buyer') 
    ? `/buyer/properties/${property.propertyId}` 
    : ROUTES.PROPERTY_DETAIL(property.propertyId);

  const { data: savedItems = [] } = useQuery({
    queryKey: ['savedProperties'],
    queryFn: getSavedProperties,
    enabled: isBuyer,
  });

  const isSaved = savedItems.some((item: any) => item.propertyId === property.propertyId);

  const { mutate: toggleSave, isPending } = useMutation({
    mutationFn: async () => {
      if (!isBuyer) throw new Error('Must be a logged in buyer to save properties.');
      if (isSaved) {
        await removeSavedProperty(property.propertyId);
      } else {
        await saveProperty(property.propertyId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedProperties'] });
      toast.success(isSaved ? 'Removed from saved properties' : 'Property saved successfully');
    },
    onError: (err: any) => {
      if (err.response?.status === 409) {
        // Already saved in backend, sync frontend state
        queryClient.invalidateQueries({ queryKey: ['savedProperties'] });
      } else {
        toast.error(err.response?.data?.error?.message || err.message || 'Failed to update saved properties');
      }
    }
  });

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPending) return;
    if (!isBuyer) {
      toast.error('Log in as a buyer to save properties.');
      return;
    }
    toggleSave();
  };

  return (
    <Link
      to={detailUrl}
      id={`property-card-${property.propertyId}`}
      className={`card group overflow-hidden block transition-all duration-300 hover:-translate-y-1 hover:shadow-gold active:scale-[0.98] active:-translate-y-1 ${featured ? 'card-gold' : ''}`}
      aria-label={`View ${property.title}`}
    >
      {/* Image */}
      <div className="relative overflow-hidden h-48 bg-dark-hover">
        {property.images?.[0] ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted">
            <Square size={32} />
          </div>
        )}
        {/* Verified Badge */}
        {isVerified && (
          <div className="absolute top-3 left-3">
            <span className="badge-verified">
              <CheckCircle size={10} />
              Verified
            </span>
          </div>
        )}
        {/* Price */}
        <div className="absolute bottom-3 right-3 bg-dark-card/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-dark-border">
          <span className="text-primary font-bold text-sm">{formatShortPrice(price)}</span>
        </div>
        {/* Save Action */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-10 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
          <button 
            onClick={handleSaveClick}
            disabled={isPending}
            className={`p-2 bg-black/60 hover:bg-primary text-white hover:text-black rounded-full backdrop-blur-sm transition-colors shadow-lg ${isSaved ? 'text-primary' : ''} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`} 
            title="Save Property"
          >
            <Heart size={16} className={isSaved ? 'fill-primary text-primary' : ''} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-sm text-white line-clamp-1 mb-1">{property.title}</h3>
        <div className="flex items-center gap-1 text-muted text-xs mb-3">
          <MapPin size={11} />
          <span>{city}{city && state ? ', ' : ''}{state}</span>
        </div>

        {/* Property details */}
        <div className="flex items-center gap-3 text-muted text-xs">
          {property.bedrooms !== undefined && (
            <span className="flex items-center gap-1"><Bed size={11} /> {property.bedrooms} bed</span>
          )}
          {property.bathrooms !== undefined && (
            <span className="flex items-center gap-1"><Bath size={11} /> {property.bathrooms} bath</span>
          )}
          <span className="flex items-center gap-1"><Square size={11} /> {area.toLocaleString()} sqft</span>
        </div>
      </div>
    </Link>
  );
};
