import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProperty } from '../services/propertyService';
import { expressInterest, getBuyerInquiries } from '../services/inquiryService';
import { getSavedProperties, saveProperty, removeSavedProperty } from '../services/userService';
import { useAuthStore } from '../store/authStore';
import { ImageGallery } from '../components/properties/ImageGallery';
import { PropertyMap } from '../components/properties/PropertyMap';
import { FullPageLoader } from '../components/common/Loader';
import { formatPrice } from '../utils/formatters';
import { toast } from 'sonner';
import { MapPin, Bed, Bath, Square, Handshake, Heart, Share2,
  ShieldCheck, Clock, Eye, AlertCircle, CheckCircle, MessageSquare
} from 'lucide-react';
import { ROUTES } from '../utils/constants';
import { useState } from 'react';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuthStore();
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isBuyer = user?.role === 'buyer';

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => getProperty(id!),
    enabled: !!id,
  });

  const interestMutation = useMutation({
    mutationFn: () => expressInterest(id!),
    onSuccess: () => {
      toast.success('Interest expressed! The seller will be notified.');
      queryClient.invalidateQueries({ queryKey: ['buyer', 'inquiries'] });
    },
    onError: (err: any) => {
      if (err.response?.status === 409) {
        toast.info('You already have a pending inquiry for this property.');
      } else {
        toast.error('Failed to express interest.');
      }
    },
  });

  // Fetch buyer's inquiries to determine current state for this property
  const { data: buyerInquiries = [] } = useQuery({
    queryKey: ['buyer', 'inquiries'],
    queryFn: getBuyerInquiries,
    enabled: isBuyer && isAuthenticated,
  });

  const myInquiry = (buyerInquiries as any[]).find((inq: any) => inq.propertyId === id);

  const city = property?.location?.city ?? (property as any)?.city ?? '';
  const state = property?.location?.state ?? (property as any)?.state ?? '';
  const address = property?.location?.address ?? (property as any)?.address ?? '';
  const pincode = property?.location?.pincode ?? (property as any)?.pincode ?? '';
  const lat = property?.location?.lat ?? (property as any)?.lat;
  const lng = property?.location?.lng ?? (property as any)?.lng;
  const price = property?.price ?? (property as any)?.salePrice ?? (property as any)?.rentPrice ?? 0;

  const { data: savedItems = [] } = useQuery({
    queryKey: ['savedProperties'],
    queryFn: getSavedProperties,
    enabled: isBuyer,
  });

  const isSaved = savedItems.some((item: any) => item.propertyId === id);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!isBuyer) throw new Error('Must be a logged in buyer to save properties.');
      if (isSaved) {
        await removeSavedProperty(id!);
      } else {
        await saveProperty(id!);
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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  };

  if (isLoading) return <FullPageLoader />;
  if (!property) return <div className="text-center py-20 text-muted">Property not found</div>;

  return (
    <div className="min-h-screen bg-dark pb-20">
      {/* Top Gallery - Full Bleed */}
      <div className="w-full h-[50vh] md:h-[60vh] lg:h-[70vh] bg-black">
        <ImageGallery images={property.images || []} title={property.title} />
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-[-4rem] relative z-10">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
          
          {/* Main Details (Title & Stats) */}
          <div className="lg:col-span-2 lg:col-start-1 lg:row-start-1">
            <div className="bg-dark-card border border-dark-border p-6 md:p-8 rounded-2xl shadow-xl backdrop-blur-xl h-full">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold tracking-wide uppercase">
                    <ShieldCheck size={14} /> Verified
                  </span>
                {property.isAuctionRequested && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold tracking-wide uppercase">
                    Auction Eligible
                  </span>
                )}
                <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 text-muted border border-white/10 rounded-full text-xs font-bold tracking-wide uppercase">
                  For Sale
                </span>
              </div>
              
              <h1 className="text-2xl md:text-3xl lg:text-5xl font-display font-black leading-tight mb-4">{property.title}</h1>
              
              <p className="text-sm md:text-lg text-muted flex items-center gap-2 mb-8">
                <MapPin className="text-primary" size={20} /> 
                {address}{address && city ? ', ' : ''}{city}{city && state ? ', ' : ''}{state} {pincode}
              </p>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-black/40 rounded-xl border border-dark-border">
                <div className="flex flex-col items-center justify-center p-2">
                  <Bed size={24} className="mb-2 text-primary" />
                  <p className="font-display font-bold text-xl md:text-2xl">{property.bedrooms || '-'}</p>
                  <p className="text-xs text-muted uppercase tracking-wider font-bold">Bedrooms</p>
                </div>
                <div className="flex flex-col items-center justify-center p-2 border-l border-dark-border sm:border-l-0">
                  <Bath size={24} className="mb-2 text-primary" />
                  <p className="font-display font-bold text-xl md:text-2xl">{property.bathrooms || '-'}</p>
                  <p className="text-xs text-muted uppercase tracking-wider font-bold">Bathrooms</p>
                </div>
                <div className="flex flex-col items-center justify-center p-2 border-t sm:border-t-0 sm:border-l border-dark-border">
                  <Square size={24} className="mb-2 text-primary" />
                  <p className="font-display font-bold text-xl md:text-2xl">{property.area?.toLocaleString()}</p>
                  <p className="text-xs text-muted uppercase tracking-wider font-bold">Sq Ft</p>
                </div>
                <div className="flex flex-col items-center justify-center p-2 border-t border-l sm:border-t-0 border-dark-border">
                  <Building2Icon size={24} className="mb-2 text-primary" />
                  <p className="font-display font-bold text-lg md:text-xl capitalize line-clamp-1">{property.type}</p>
                  <p className="text-xs text-muted uppercase tracking-wider font-bold">Property Type</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Sidebar (Asking Price, etc.) - Placed middle in DOM for mobile, forced to right column on desktop */}
          <div className="lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:row-span-2">
            <div className="sticky top-24 space-y-6">
              
              {/* Pricing Card */}
              <div className="card border-primary/20 bg-dark-card/80 backdrop-blur-xl p-8 relative overflow-hidden group hover:border-primary/50 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-10 group-hover:bg-primary/20 transition-colors" />
                <p className="text-muted text-sm mb-2 uppercase tracking-widest font-bold">Asking Price</p>
                <p className="text-3xl md:text-4xl lg:text-5xl font-display font-black text-white mb-2">
                  {formatPrice(price)}
                </p>
                <p className="text-sm text-primary/80 font-semibold mb-8 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Est. EMI: {formatPrice(price * 0.0085)}/mo
                </p>

                <div className="space-y-4">
                  {user?.role !== 'seller' && (
                    <>
                      {property.status === 'sold' ? (
                        <div className="w-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold uppercase tracking-widest px-6 py-4 rounded-xl flex items-center justify-center gap-2">
                          <CheckCircle size={20} /> Property Sold
                        </div>
                      ) : isAuthenticated ? (
                        isBuyer && (
                          <>
                            {!myInquiry && (
                              <button
                                onClick={() => interestMutation.mutate()}
                                disabled={interestMutation.isPending}
                                className="w-full bg-primary text-black font-bold uppercase tracking-widest px-6 py-4 rounded-xl hover:bg-yellow-400 hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                              >
                                <Handshake size={20} /> {interestMutation.isPending ? 'Sending...' : 'Express Interest'}
                              </button>
                            )}
                            {myInquiry?.status === 'pending' && (
                              <div className="w-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-bold uppercase tracking-widest px-6 py-4 rounded-xl flex items-center justify-center gap-2">
                                <Clock size={20} /> Request Sent — Awaiting Seller
                              </div>
                            )}
                            {myInquiry?.status === 'accepted' && (
                              <button
                                onClick={() => navigate(`/buyer/chat?roomId=${myInquiry.roomId}`)}
                                className="w-full bg-emerald-500 text-white font-bold uppercase tracking-widest px-6 py-4 rounded-xl hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2"
                              >
                                <MessageSquare size={20} /> Open Chat
                              </button>
                            )}
                            {myInquiry?.status === 'rejected' && (
                              <div className="w-full bg-red-500/10 border border-red-500/30 text-red-400 font-bold uppercase tracking-widest px-6 py-4 rounded-xl flex items-center justify-center gap-2">
                                <AlertCircle size={20} /> Request Declined
                              </div>
                            )}
                          </>
                        )
                      ) : (
                        <Link to={ROUTES.LOGIN} className="w-full bg-primary text-black font-bold uppercase tracking-widest px-6 py-4 rounded-xl hover:bg-yellow-400 hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all flex items-center justify-center gap-2">
                          Log in to Contact
                        </Link>
                      )}

                      <div className="flex gap-4">
                        <button 
                          onClick={() => saveMutation.mutate()}
                          disabled={saveMutation.isPending}
                          className={`flex-1 px-4 py-3 bg-dark-hover border border-dark-border rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/5 hover:border-white/20 transition-colors ${isSaved ? 'text-primary border-primary/30' : ''}`}
                        >
                          <Heart size={18} className={isSaved ? 'fill-primary text-primary' : ''} /> {isSaved ? 'Saved' : 'Save'}
                        </button>
                        <button 
                          onClick={handleShare}
                          className="flex-1 px-4 py-3 bg-dark-hover border border-dark-border rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/5 hover:border-white/20 transition-colors relative"
                        >
                          <Share2 size={18} /> Share
                          {showShareTooltip && (
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-xs py-1 px-2 rounded font-bold whitespace-nowrap">
                              Link copied!
                            </span>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                  {user?.role === 'seller' && user?.userId === property.sellerId && (
                    <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-4 text-center">
                      <p className="text-secondary font-bold text-sm mb-2">This is your property</p>
                      <Link to={`/seller/add-property?edit=${property.propertyId}`} className="text-white text-sm hover:underline">
                        Edit Details
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Seller Info Card */}
              <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
                <h3 className="font-display font-bold text-lg mb-4">Seller Information</h3>
                <div className="flex items-center gap-3 md:gap-4 mb-6">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-dark-hover border-2 border-primary flex items-center justify-center text-lg md:text-xl font-bold text-primary shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                    {property.sellerName?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <p className="font-bold text-white text-base md:text-lg">{property.sellerName || 'Verified Seller'}</p>
                    <p className="text-xs md:text-sm text-muted flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-400" /> Identity Verified</p>
                  </div>
                </div>

              </div>

              {/* Stats Footer */}
              <div className="flex justify-between items-center px-4 pt-4 border-t border-dark-border/50 text-xs text-muted font-bold tracking-wide uppercase">
                <span className="flex items-center gap-1.5"><Eye size={14} /> {property.viewCount || 0} Views</span>
                <span className="flex items-center gap-1.5"><Clock size={14} /> Listed {new Date(property.createdAt).toLocaleDateString()}</span>
              </div>
              

            </div>
          </div>

          {/* Description & Rest */}
          <div className="lg:col-span-2 lg:col-start-1 lg:row-start-2 space-y-8">
            {/* Description */}
            <div className="bg-dark-card border border-dark-border p-6 md:p-8 rounded-2xl">
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 font-display flex items-center gap-2">
                <FileTextIcon /> Property Description
              </h2>
              <div className="prose prose-invert max-w-none text-muted leading-relaxed">
                <p className="whitespace-pre-wrap text-sm md:text-lg">{property.description}</p>
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-dark-card border border-dark-border p-6 md:p-8 rounded-2xl">
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 font-display flex items-center gap-2">
                <SparklesIcon /> Premium Amenities
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.amenities?.map((a: string) => (
                  <div key={a} className="flex items-center gap-3 p-4 rounded-xl bg-black/40 border border-dark-border hover:border-primary/30 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm font-semibold text-white/90 capitalize">
                      {a.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="bg-dark-card border border-dark-border p-6 md:p-8 rounded-2xl">
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 font-display flex items-center gap-2">
                <MapPin className="text-primary" /> Location
              </h2>
              <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted uppercase tracking-wider mb-1">City</p>
                  <p className="font-bold">{city || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted uppercase tracking-wider mb-1">State</p>
                  <p className="font-bold">{state || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted uppercase tracking-wider mb-1">Pincode</p>
                  <p className="font-bold">{pincode || '—'}</p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <p className="text-xs text-muted uppercase tracking-wider mb-1">Address</p>
                  <p className="font-bold text-sm">{address || '—'}</p>
                </div>
              </div>
              <div className="h-[400px] w-full rounded-xl overflow-hidden border border-dark-border relative bg-black/50">
                {lat !== undefined && lng !== undefined ? (
                  <PropertyMap properties={[property as any]} center={{ lat, lng }} zoom={15} />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <MapPin size={48} className="text-primary/50 mb-4" />
                    <h3 className="font-display font-bold text-xl mb-2">Location Not Available</h3>
                    <p className="text-muted text-sm max-w-sm mb-6">Coordinates for this property are missing.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Icons
const Building2Icon = ({ size, className }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
);

const FileTextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
);
