import { Heart, ShieldCheck, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatShortPrice } from '../../utils/formatters';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSavedProperties, saveProperty, removeSavedProperty } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

// Accepts the raw DynamoDB property shape returned by GET /v1/properties
interface Property {
  propertyId: string;
  title: string;
  address?: string;
  city?: string;
  state?: string;
  salePrice?: number;
  price?: number;
  type: string;
  listingType?: string;
  images?: string[];
  verificationStatus?: string;
  isVerified?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
}

interface BuyerPropertyCardProps {
  property: Property;
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80';

export function BuyerPropertyCard({ property }: BuyerPropertyCardProps) {
  const image = property.images?.[0] || PLACEHOLDER;
  const location = [property.city, property.state].filter(Boolean).join(', ') || property.address || 'Location not specified';
  const price = property.salePrice ?? property.price ?? 0;
  const verified = property.isVerified || property.verificationStatus === 'verified';

  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isBuyer = user?.role === 'buyer';

  const { data: savedItems = [] } = useQuery({
    queryKey: ['savedProperties'],
    queryFn: getSavedProperties,
    enabled: isBuyer,
  });

  const isSaved = savedItems.some((item: any) => item.propertyId === property.propertyId);

  const { mutate: toggleSave, isPending } = useMutation({
    mutationFn: async () => {
      if (!isBuyer) throw new Error('Must be a logged in buyer');
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
        queryClient.invalidateQueries({ queryKey: ['savedProperties'] });
      } else {
        toast.error(err.response?.data?.error?.message || err.message || 'Failed to update saved properties');
      }
    }
  });

  return (
    <div className="relative flex flex-col bg-[#0A0A0A]/60 backdrop-blur-md border border-dark-border/80 hover:border-primary/45 rounded-2xl overflow-hidden group transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_rgba(255,215,0,0.035)] h-full shadow-lg">
      
      {/* Image Section */}
      <div className="aspect-[16/10] w-full relative overflow-hidden bg-black border-b border-dark-border/60">
        <img
          src={image}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-750 ease-out group-hover:scale-105"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/10 pointer-events-none" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 pointer-events-none z-10">
          {verified && (
            <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-2.5 py-1 rounded border border-emerald-500/25 flex items-center gap-1 uppercase tracking-wider backdrop-blur-md shadow-md">
              <ShieldCheck size={11} /> Verified
            </span>
          )}
          <span className="bg-black/60 text-gray-200 text-[9px] font-bold px-2.5 py-1 rounded border border-white/10 uppercase tracking-wider backdrop-blur-md shadow-md">
            {property.type}
          </span>
          <span className="bg-black/65 text-primary text-[9px] font-extrabold px-2 py-1 rounded border border-white/10 flex items-center gap-0.5 backdrop-blur-md shadow-md">
            ★ 4.9
          </span>
        </div>

        {/* Floating Actions */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if(isPending) return; toggleSave(); }}
            disabled={isPending}
            className={`p-2.5 bg-black/60 border border-white/10 hover:bg-primary text-white hover:text-black rounded-xl backdrop-blur-md transition-all duration-300 shadow-md ${isSaved ? 'text-primary border-primary/25 bg-black/80' : ''} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`} 
            title="Save Property"
          >
            <Heart size={14} className={`transition-transform duration-200 active:scale-75 ${isSaved ? 'fill-primary text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* Property Details Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          {/* Price Tag */}
          <div className="text-primary font-display font-black text-2xl tracking-tight leading-none mb-1">
            {formatShortPrice(price)}
          </div>
          
          {/* Title */}
          <h3 className="text-white font-display font-bold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors duration-200">
            {property.title}
          </h3>
          
          {/* Location */}
          <div className="flex items-center gap-1 text-muted text-xs pt-1 font-medium truncate">
            <MapPin size={12} className="text-primary/70 shrink-0" />
            <span className="truncate">{location}</span>
          </div>

          {/* Specs Row */}
          <div className="flex items-center justify-between text-[9px] text-muted/70 font-bold uppercase tracking-wider pt-4 mt-1 border-t border-dark-border/40">
            <span>{property.bedrooms || 0} Beds</span>
            <span>•</span>
            <span>{property.bathrooms || 0} Baths</span>
            <span>•</span>
            <span>{property.area || 0} Sq Ft</span>
          </div>
        </div>

        {/* Separator & Action buttons */}
        <div className="flex gap-2.5 mt-5 pt-4 border-t border-dark-border/40">
          <Link
            to={`/properties/${property.propertyId}`}
            className="flex-1 text-center bg-white/5 hover:bg-primary text-white hover:text-black py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border border-white/10 hover:border-primary active:scale-[0.98] hover:shadow-gold"
          >
            View Details
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/properties/${property.propertyId}#inquire`;
            }}
            className="flex-1 text-center bg-primary/5 hover:bg-primary text-primary hover:text-black py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border border-primary/20 hover:border-primary active:scale-[0.98] hover:shadow-gold"
          >
            Inquire
          </button>
        </div>
      </div>
    </div>
  );
}
