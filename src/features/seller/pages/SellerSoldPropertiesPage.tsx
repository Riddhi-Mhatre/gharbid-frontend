import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSellerProperties } from '../../../services/sellerService';
import { Building2, Eye, MapPin, CheckCircle } from 'lucide-react';

const getCity  = (p: any) => p.city  ?? p.location?.city  ?? '—';
const getState = (p: any) => p.state ?? p.location?.state ?? '—';
const getPrice = (p: any) => {
  const raw = p.salePrice ?? p.rentPrice ?? p.price ?? 0;
  if (!raw) return '—';
  return `₹${Number(raw).toLocaleString('en-IN')}`;
};
const getStatus = (p: any) => {
  if (p.status === 'sold') return 'sold';
  return p.verificationStatus ?? p.status ?? 'pending';
};

export default function SellerSoldPropertiesPage() {
  const navigate = useNavigate();

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['seller', 'properties'],
    queryFn: getSellerProperties,
  });

  const soldProperties = (properties as any[])
    .filter(p => getStatus(p) === 'sold')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center gap-4 border-b border-dark-border pb-6">
        <div className="p-3 bg-secondary/10 rounded-lg">
          <CheckCircle size={28} className="text-secondary" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-black uppercase tracking-widest text-white">Sold Properties</h1>
          <p className="text-muted text-sm mt-1">View properties you have successfully sold.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-dark-border/40 rounded-xl animate-pulse" />)}
        </div>
      ) : soldProperties.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-dark-border rounded-xl bg-black/20 flex flex-col items-center justify-center">
          <Building2 size={64} className="mb-6 text-muted opacity-20" />
          <p className="text-muted font-bold tracking-widest uppercase mb-2">No Sold Properties</p>
          <p className="text-sm text-muted/60">You haven't sold any properties yet.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {soldProperties.map((property) => (
            <div key={property.propertyId} className="bg-dark-card border border-dark-border rounded-xl p-6 flex flex-col md:flex-row gap-6 hover:border-secondary/50 transition-all duration-300">
              <div className="w-full md:w-64 h-40 shrink-0 rounded-lg overflow-hidden bg-black/40 border border-dark-border flex items-center justify-center relative group">
                {property.images?.[0] ? (
                  <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <Building2 size={40} className="text-muted opacity-30" />
                )}
                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest border border-white/10 text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  {property.type || 'Property'}
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{property.title || 'Untitled Property'}</h3>
                    <p className="text-sm text-muted flex items-center gap-2">
                      <MapPin size={14} className="text-primary" /> {getCity(property)}, {getState(property)}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-[10px] text-muted uppercase tracking-widest mb-1">Sale Price</p>
                    <p className="text-2xl font-display font-bold text-primary">{getPrice(property)}</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-t border-dark-border pt-4 gap-4">
                  <div className="flex gap-6">
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-widest mb-1">Listed On</p>
                      <p className="text-xs font-bold text-white">{new Date(property.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-widest mb-1">Total Views</p>
                      <p className="text-xs font-bold text-white flex items-center gap-1"><Eye size={12} className="text-muted" /> {property.viewsCount ?? property.viewCount ?? 0}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      SOLD
                    </span>
                    <button 
                      onClick={() => navigate(`/properties/${property.propertyId}`)}
                      className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] font-bold uppercase tracking-widest transition-colors border border-dark-border"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
