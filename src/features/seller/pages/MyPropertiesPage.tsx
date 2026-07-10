import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSellerProperties, deleteSellerProperty, markPropertySold } from '../../../services/sellerService';
import {
  Building2, Plus, Pencil, Trash2, FileText, Eye, Gavel, CheckCircle,
  MapPin, Calendar, Sparkles, Compass
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── Status badge configs ─────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; class: string; icon?: any }> = {
  verified:  { label: 'Approved', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]' },
  approved:  { label: 'Approved', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]' },
  sold:      { label: 'Sold',     class: 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.05)]' },
  pending:   { label: 'Pending',  class: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.05)]' },
  rejected:  { label: 'Rejected', class: 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]' },
  draft:     { label: 'Draft',    class: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function MyPropertiesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter') || searchParams.get('status') || 'all';
  const sortParam = searchParams.get('sort') || 'latest';
  const queryClient = useQueryClient();

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['seller', 'properties'],
    queryFn: getSellerProperties,
  });

  let filteredProperties = (properties as any[]).filter(p => {
    const status = getStatus(p);
    if (filterParam === 'sold') return status === 'sold';
    if (status === 'sold') return false; 
    if (!filterParam || filterParam === 'all') return true;
    return status === filterParam;
  });

  if (sortParam === 'views') {
    filteredProperties.sort((a, b) => (b.viewsCount ?? b.viewCount ?? 0) - (a.viewsCount ?? a.viewCount ?? 0));
  } else if (sortParam === 'inquiries') {
    filteredProperties.sort((a, b) => {
      const aInquiries = a.inquiries ?? Math.floor((a.viewsCount ?? a.viewCount ?? 0) * 0.05);
      const bInquiries = b.inquiries ?? Math.floor((b.viewsCount ?? b.viewCount ?? 0) * 0.05);
      return bInquiries - aInquiries;
    });
  } else {
    filteredProperties.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const deleteMutation = useMutation({
    mutationFn: deleteSellerProperty,
    onSuccess: () => {
      toast.success('Property deleted.');
      queryClient.invalidateQueries({ queryKey: ['seller', 'properties'] });
    },
    onError: () => toast.error('Failed to delete property.'),
  });

  const handleDelete = (propertyId: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    deleteMutation.mutate(propertyId);
  };

  const soldMutation = useMutation({
    mutationFn: markPropertySold,
    onSuccess: () => {
      toast.success('Property marked as sold.');
      queryClient.invalidateQueries({ queryKey: ['seller'] });
    },
    onError: () => toast.error('Failed to mark property as sold.'),
  });

  const handleMarkSold = (propertyId: string, title: string) => {
    if (!window.confirm(`Mark "${title}" as sold? This will remove it from active listings.`)) return;
    soldMutation.mutate(propertyId);
  };

  const handleFilterChange = (filterVal: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('filter', filterVal);
    setSearchParams(newParams);
  };

  const handleSortChange = (sortVal: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', sortVal);
    setSearchParams(newParams);
  };

  const tabItems = [
    { value: 'all', label: 'All Listings' },
    { value: 'sold', label: 'Sold' },
  ];

  return (
    <div className="min-h-screen text-white bg-dark pb-16">
      
      {/* Header Area */}
      <div className="relative overflow-hidden bg-gradient-to-br from-dark-card via-black to-dark-card border-b border-dark-border p-6 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {/* Decorative Glows */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest">
              <Sparkles size={12} className="animate-pulse" /> Portfolio Management
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight text-white leading-tight">
              My Properties
            </h1>
            <p className="text-muted/90 font-light max-w-xl text-sm leading-relaxed">
              Manage your real estate listings, update details, upload legal documents, and track approval status.
            </p>
          </div>
          <button
            onClick={() => navigate('/seller/add-property')}
            className="bg-primary hover:bg-yellow-400 text-black rounded-xl font-bold uppercase tracking-widest text-xs px-6 py-3.5 flex items-center gap-2 hover:shadow-gold active:scale-95 transition-all duration-300 self-start md:self-auto"
          >
            <Plus size={18} /> Add Property
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-12 mt-10 md:mt-12 space-y-8">
        
        {/* Filters and Sorting Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-dark-border/60 pb-4">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {tabItems.map((tab) => {
              const isActive = filterParam === tab.value || (tab.value === 'approved' && filterParam === 'verified');
              return (
                <button
                  key={tab.value}
                  onClick={() => handleFilterChange(tab.value)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 border ${
                    isActive
                      ? 'bg-primary text-black border-primary shadow-gold'
                      : 'bg-dark-card/40 text-muted hover:text-white border-dark-border hover:bg-white/5 hover:border-white/10 active:scale-95 active:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Sort By:</span>
            <select
              value={sortParam}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-dark-card/40 border border-dark-border text-xs font-bold text-white rounded-xl px-4 py-2.5 focus:border-primary focus:outline-none transition-all cursor-pointer"
            >
              <option value="latest" className="bg-[#0A0A0A] text-white">Latest Listed</option>
              <option value="views" className="bg-[#0A0A0A] text-white">Most Viewed</option>
              <option value="inquiries" className="bg-[#0A0A0A] text-white">Most Inquiries</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-[4/3] w-full bg-dark-card border border-dark-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 border border-dashed border-dark-border/60 rounded-2xl bg-dark-card/20 text-center space-y-4">
            <div className="p-4 bg-white/5 rounded-full text-muted border border-white/5 mb-2">
              <Compass size={32} className="opacity-45 animate-spin-slow" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-display font-bold text-white">
                {filterParam && filterParam !== 'all' ? `No ${filterParam} properties` : 'No Properties Listed'}
              </h3>
              <p className="text-muted text-xs leading-relaxed max-w-sm mx-auto">
                {filterParam && filterParam !== 'all'
                  ? `You don't have any properties matching "${filterParam}".` 
                  : "You haven't added any properties to your portfolio yet. Start by creating your first listing."}
              </p>
            </div>
            <button
              onClick={() => navigate('/seller/add-property')}
              className="bg-primary hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:shadow-gold"
            >
              Add First Property
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property: any) => {
              const verStatus = getStatus(property);
              const verCfg = statusConfig[verStatus] ?? statusConfig.pending;
              return (
                <div
                  key={property.propertyId}
                  className="relative flex flex-col bg-dark-card/40 backdrop-blur-md border border-dark-border hover:border-primary/20 active:border-primary/40 rounded-2xl overflow-hidden group transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(255,215,0,0.04)] active:scale-[0.98] active:-translate-y-0.5 h-full shadow-lg"
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-[16/10] bg-black overflow-hidden border-b border-dark-border">
                    {property.images?.[0] ? (
                      <img src={property.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-750 ease-out" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted/65">
                        <Building2 size={40} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex gap-2 pointer-events-none z-10">
                      <span className={`text-[9px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider backdrop-blur-md shadow-md ${verCfg.class}`}>
                        {verCfg.label}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end z-10 pointer-events-none">
                      <p className="text-2xl font-display font-black text-primary tracking-tight">{getPrice(property)}</p>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-white bg-black/60 border border-white/10 px-2.5 py-1 rounded-lg backdrop-blur-md shadow-md">
                        <Eye size={12} className="text-primary shrink-0" /> {property.viewsCount ?? property.viewCount ?? 0}
                      </div>
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display font-bold text-lg text-white line-clamp-1 mb-2 group-hover:text-primary transition-colors duration-200">{property.title}</h3>
                      
                      <div className="space-y-1.5 mb-5 text-xs text-muted">
                        <p className="flex items-center gap-1.5 font-medium tracking-wide">
                          <MapPin size={13} className="text-primary/70 shrink-0" /> {getCity(property)}, {getState(property)}
                        </p>
                        <p className="flex items-center gap-1.5 font-medium tracking-wide">
                          <Calendar size={13} className="text-primary/70 shrink-0" /> Listed: {new Date(property.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Status badges row removed per user request */}

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-dark-border/80">
                        <button
                          onClick={() => navigate(`/properties/${property.propertyId}`)}
                          className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 active:scale-95 active:bg-white/20 transition-all"
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          onClick={() => navigate(`/seller/add-property?edit=${property.propertyId}`)}
                          className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-primary hover:border-primary/30 active:scale-95 active:bg-white/20 active:border-primary/50 transition-all"
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          onClick={() => navigate(`/seller/documents?propertyId=${property.propertyId}`)} 
                          className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-secondary hover:border-secondary/30 active:scale-95 active:bg-white/20 active:border-secondary/50 transition-all"
                        >
                          <FileText size={13} /> Docs
                        </button>
                        <button
                          onClick={() => handleDelete(property.propertyId, property.title)}
                          disabled={deleteMutation.isPending}
                          className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white bg-white/5 border border-white/10 rounded-xl hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 active:scale-95 active:bg-red-500/20 active:border-red-500/50 transition-all disabled:opacity-50"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                      
                      {verStatus === 'approved' && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dark-border/60">
                          <button
                            onClick={() => navigate(`/seller/auctions/${property.propertyId}`)}
                            className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-black bg-primary rounded-xl hover:bg-yellow-400 hover:shadow-gold transition-all active:scale-95"
                          >
                            <Gavel size={13} /> Auction
                          </button>
                          <button
                            onClick={() => handleMarkSold(property.propertyId, property.title)}
                            disabled={soldMutation.isPending}
                            className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <CheckCircle size={13} /> Mark Sold
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
