import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { 
  Gavel, 
  ArrowRight, 
  Trophy, 
  Building2, 
  Bookmark, 
  ShieldAlert, 
  Sparkles, 
  Compass, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight,
  ShieldCheck,
  CheckCircle,
  MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../utils/constants';
import { BuyerPropertyCard } from '../../../components/properties/BuyerPropertyCard';
import { AuctionCard } from '../../../components/auctions/AuctionCard';
import { BidTable } from '../../../components/auctions/BidTable';
import { getAuctions } from '../../../services/auctionService';
import { getProperties } from '../../../services/propertyService';
import { getBuyerBids, getPurchases, getSavedProperties } from '../../../services/userService';

const getCity = (p: any) => p.city ?? p.location?.city ?? '—';
const getState = (p: any) => p.state ?? p.location?.state ?? '—';
const getPrice = (p: any) => {
  const raw = p.salePrice ?? p.rentPrice ?? p.price ?? 0;
  return raw ? `₹${Number(raw).toLocaleString('en-IN')}` : '—';
};

export default function BuyerDashboard() {
  const { user } = useAuthStore();

  // 1. Fetch live auctions (for Active Auctions stats and Trending list)
  const { data: liveAuctions = [], isLoading: liveAuctionsLoading } = useQuery({
    queryKey: ['buyer', 'dashboard-live-auctions'],
    queryFn: () => getAuctions('live'),
  });

  // 2. Fetch properties (for recommendations and enrichment)
  const { data: properties = [], isLoading: propsLoading } = useQuery({
    queryKey: ['buyer', 'dashboard-properties'],
    queryFn: () => getProperties(),
  });

  // 3. Fetch buyer bids (for dashboard stats and active bids list)
  const { data: buyerBids = [], isLoading: bidsLoading } = useQuery({
    queryKey: ['buyer', 'dashboard-my-bids'],
    queryFn: getBuyerBids,
  });

  // 4. Fetch buyer purchases
  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ['buyer', 'dashboard-purchases'],
    queryFn: getPurchases,
  });

  // 5. Fetch saved properties
  const { data: savedProperties = [], isLoading: savedLoading } = useQuery({
    queryKey: ['buyer', 'dashboard-saved-properties'],
    queryFn: getSavedProperties,
  });

  const isLoading = liveAuctionsLoading || propsLoading || bidsLoading || purchasesLoading || savedLoading;

  // Enriched live auctions for "Trending Auctions" list
  const propertyMap = new Map((properties as any[]).map(p => [p.propertyId, p]));
  const enrichedTrending = liveAuctions.slice(0, 2).map((a: any) => ({
    ...a,
    property: propertyMap.get(a.propertyId),
  }));

  // Recommended Properties
  const recommendedProperties = (properties as any[]).slice(0, 2);
  const featuredProperties = (properties as any[]).slice(0, 3);

  // Deduplicate bids to only keep the highest bid per auction/property
  const highestBidsMap = new Map();
  for (const b of (buyerBids as any[])) {
    const existing = highestBidsMap.get(b.auctionId || b.propertyId);
    if (!existing || b.myBid > existing.myBid) {
      highestBidsMap.set(b.auctionId || b.propertyId, b);
    }
  }
  const uniqueHighestBids = Array.from(highestBidsMap.values());

  // Total bids placed (all bids, un-deduplicated)
  const totalBidsCount = (buyerBids as any[]).length;

  // Won auctions count (when deal is closed)
  const auctionsWonCount = uniqueHighestBids.filter((b: any) => (b.isWinner || b.status === 'won') && b.auctionStatus === 'completed').length;

  // Property stats
  const purchasedCount = purchases.length;
  const savedCount = savedProperties.length;

  // Map backend bids list to matches for BidTable component format
  const mappedBids = uniqueHighestBids.map((b: any) => ({
    id: b.bidId,
    propertyTitle: b.propertyName ?? 'Unknown Property',
    image: b.image || b.propertyImage || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=80&q=80',
    currentBid: b.currentHighestBid,
    myBid: b.myBid,
    status: b.status === 'won' ? 'winning' as const : b.status === 'lost' ? 'outbid' as const : b.status as any,
    auctionEnd: b.auctionEndTime ? new Date(b.auctionEndTime).toLocaleString('en-IN') : '—',
  }));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-44 gap-4 animate-fade-in bg-[#030303]">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-2 border-primary/20 rounded-full animate-ping absolute" />
          <div className="w-12 h-12 border-t-2 border-r-2 border-primary rounded-full animate-spin" />
        </div>
        <div className="space-y-1 text-center">
          <p className="text-white font-display font-semibold tracking-wide text-sm">Preparing Your Dashboard</p>
          <p className="text-muted/65 text-xs font-sans">Connecting to secure real estate registry...</p>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Purchased Properties',
      value: purchasedCount,
      icon: Building2,
      path: ROUTES.BUYER_PURCHASES,
      color: 'text-emerald-400',
      trend: `${purchasedCount} Assets`,
      progressClass: 'bg-emerald-400 w-[35%]',
      glow: 'hover:shadow-[0_25px_50px_rgba(16,185,129,0.06)] hover:border-emerald-500/40',
      iconGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-emerald-500/10 border-emerald-500/20',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    },
    {
      label: 'Saved Properties',
      value: savedCount,
      icon: Bookmark,
      path: ROUTES.BUYER_SAVED,
      color: 'text-primary',
      trend: `${savedCount} Saved`,
      progressClass: 'bg-primary w-[65%]',
      glow: 'hover:shadow-[0_25px_50px_rgba(255,215,0,0.06)] hover:border-primary/40',
      iconGlow: 'shadow-[0_0_15px_rgba(255,215,0,0.15)] bg-primary/10 border-primary/20',
      badgeClass: 'bg-primary/10 text-primary border border-primary/20',
    },
    {
      label: 'Total Bids Placed',
      value: totalBidsCount,
      icon: Gavel,
      path: ROUTES.BUYER_BIDS,
      color: 'text-rose-400',
      trend: 'All Bids',
      progressClass: 'bg-rose-400 w-[55%]',
      glow: 'hover:shadow-[0_25px_50px_rgba(244,63,94,0.06)] hover:border-rose-500/40',
      iconGlow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)] bg-rose-500/10 border-rose-500/20',
      badgeClass: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    },
    {
      label: 'Auctions Won',
      value: auctionsWonCount,
      icon: Trophy,
      path: `${ROUTES.BUYER_BIDS}?filter=won`,
      color: 'text-purple-400',
      trend: 'Trophies Won',
      progressClass: 'bg-purple-400 w-[25%]',
      glow: 'hover:shadow-[0_25px_50px_rgba(168,85,247,0.06)] hover:border-purple-500/40',
      iconGlow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)] bg-purple-500/10 border-purple-500/20',
      badgeClass: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    },
  ];

  return (
    <div className="space-y-10 md:space-y-12 animate-fade-in pb-16 font-sans">
      
      {/* Verification Warning Card */}
      {!user?.isVerified && (
        <div className="relative overflow-hidden bg-gradient-to-r from-red-950/20 via-red-900/10 to-transparent border border-red-500/20 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-5 -mb-4 shadow-[0_10px_30px_rgba(239,68,68,0.05)] group">
          <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-red-500 to-red-700" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/25 text-red-400 shrink-0 group-hover:scale-105 transition-transform duration-300">
              <ShieldAlert size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-red-400 font-display font-bold text-base tracking-wide flex items-center gap-2">
                Action Required: Identity Verification
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed max-w-2xl">
                To start bidding on premium real estate and participate in live auctions, please upload your verification credentials.
              </p>
            </div>
          </div>
          <Link 
            to={ROUTES.BUYER_LEGAL} 
            className="relative z-10 w-full md:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs uppercase tracking-widest font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] text-center whitespace-nowrap active:scale-[0.98]"
          >
            Upload Documents
          </Link>
        </div>
      )}

      {/* Welcome Hero Card */}
      <div className="relative group/hero">
        {/* Subtle gold ambient glow behind the card */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-yellow-600/2 rounded-3xl blur-3xl opacity-50 pointer-events-none" />

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 p-8 md:p-12 min-h-[360px] flex flex-col lg:flex-row lg:items-center justify-between bg-gradient-to-br from-black via-black/95 to-primary/5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] group z-10 gap-8">
          {/* Background luxury house image */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-45 group-hover/hero:scale-105 transition-transform duration-[6000ms] ease-out pointer-events-none z-0"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80')` }}
          />
          {/* Subtle overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent pointer-events-none z-0" />

          {/* Left side content */}
          <div className="relative z-10 space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest shadow-[0_0_12px_rgba(255,215,0,0.02)]">
              <Sparkles size={12} className="animate-pulse" /> Premium Buyer Portal
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight text-white leading-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-400 to-yellow-600 font-extrabold">{user?.name?.split(' ')[0] || 'Leena'}</span>
            </h1>
            <p className="text-muted/80 font-light text-xs md:text-sm leading-relaxed max-w-md">
              Discover luxury properties, participate in live auctions and secure your dream investment.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link 
                to={ROUTES.PROPERTIES} 
                className="px-6 py-3 bg-gradient-to-r from-primary to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all duration-300 shadow-md hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 border border-primary/20"
              >
                <Compass size={14} /> Explore Properties
              </Link>
              <Link 
                to={ROUTES.BUYER_AUCTIONS} 
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all duration-300 border border-white/10 hover:border-white/20 hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 backdrop-blur-sm shadow-md"
              >
                <Gavel size={14} /> View Auctions
              </Link>
            </div>
          </div>

          {/* Right side floating glass widgets */}
          <div className="relative z-10 flex flex-col sm:flex-row lg:flex-col gap-4 w-full lg:w-auto shrink-0 lg:max-w-xs z-10">
            {/* Saved Listings Card */}
            <div className="p-4 rounded-2xl border border-white/10 hover:border-primary/25 bg-black/75 backdrop-blur-md shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-inner">
                <Bookmark size={16} />
              </div>
              <div>
                <p className="text-[9px] text-muted uppercase tracking-wider font-semibold">Saved Properties</p>
                <p className="text-sm font-extrabold text-white">{savedCount} Saved</p>
              </div>
            </div>

            {/* Total Bids Card */}
            <div className="p-4 rounded-2xl border border-white/10 hover:border-rose-500/25 bg-black/75 backdrop-blur-md shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 shadow-inner">
                <Gavel size={16} />
              </div>
              <div>
                <p className="text-[9px] text-muted uppercase tracking-wider font-semibold">Total Bids</p>
                <p className="text-sm font-extrabold text-white">{totalBidsCount} Placed</p>
              </div>
            </div>

            {/* Verification status Card */}
            <div className={`p-4 rounded-2xl border bg-black/75 backdrop-blur-md shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-3.5 ${
              user?.isVerified
                ? 'border-white/10 hover:border-primary/25'
                : 'border-red-500/20 hover:border-red-500/40 shadow-sm'
            }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                user?.isVerified 
                  ? 'bg-primary/10 border-primary/25 text-primary' 
                  : 'bg-red-500/10 border-red-500/25 text-red-400'
              } shadow-inner`}>
                {user?.isVerified ? <ShieldCheck size={16} /> : <ShieldAlert size={16} className="animate-pulse" />}
              </div>
              <div>
                <p className="text-[9px] text-muted uppercase tracking-wider font-semibold">Accreditation</p>
                <p className={`text-sm font-extrabold ${user?.isVerified ? 'text-primary' : 'text-red-400'}`}>
                  {user?.isVerified ? 'Verified Buyer' : 'Action Required'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((stat) => (
          <Link
            key={stat.label}
            to={stat.path}
            className={`relative overflow-hidden bg-gradient-to-br from-black/80 via-[#0A0A0A] to-black/95 backdrop-blur-xl border border-dark-border/85 p-6 rounded-2xl transition-all duration-500 hover:-translate-y-2.5 cursor-pointer group flex flex-col justify-between h-44 shadow-2xl shadow-black/70 ${stat.glow}`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="absolute -right-4 -top-4 opacity-[0.01] group-hover:opacity-[0.04] transition-opacity duration-500 pointer-events-none text-white">
              <stat.icon size={90} />
            </div>
            
            <div className="flex justify-between items-start">
              <div className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-500 group-hover:scale-105 shadow-inner ${stat.iconGlow}`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <ArrowUpRight size={15} className="text-muted/60 group-hover:text-white transition-all duration-300" />
            </div>
            
            <div className="space-y-2">
              <span className="text-4xl sm:text-5xl font-display font-black text-white tracking-tight leading-none block select-none">{stat.value}</span>
              
              {/* Mini progress indicator */}
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1.5">
                <div className={`h-full rounded-full transition-all duration-1000 ${stat.progressClass}`} />
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <p className="text-[9px] text-muted/60 font-bold uppercase tracking-widest group-hover:text-muted/85 transition-colors">{stat.label}</p>
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded flex items-center shrink-0 shadow-sm ${stat.badgeClass}`}>
                  {stat.trend}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </section>

      {/* Recommended For You (AI-Powered Personalized Section) */}
      <section className="bg-gradient-to-br from-dark-card/50 via-black/30 to-dark-card/50 border border-dark-border/80 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
        <div className="flex items-end justify-between border-b border-dark-border/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-widest">
              <Compass size={14} className="animate-spin-slow" /> Personalized Selection
            </div>
            <h2 className="text-2xl font-display font-extrabold uppercase tracking-tight text-white">Recommended For You</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {recommendedProperties.map((property: any) => (
            <div key={property.propertyId} className="bg-gradient-to-br from-black/80 via-[#0A0A0A] to-black/95 border border-dark-border/80 hover:border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row gap-5 hover:shadow-[0_20px_45px_rgba(255,215,0,0.015)] transition-all duration-500 hover:-translate-y-1 group">
              <div className="sm:w-1/3 aspect-[16/10] sm:aspect-square rounded-xl overflow-hidden border border-dark-border/60 bg-black shrink-0 relative">
                {property.images?.[0] ? (
                  <img src={property.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted/65"><Building2 size={24} /></div>
                )}
                <span className="absolute top-2 left-2 text-[8px] font-bold px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/25 uppercase tracking-wider backdrop-blur-md shadow-md">AI Match</span>
              </div>
              <div className="flex-1 flex flex-col justify-between py-1 space-y-4">
                <div className="space-y-2">
                  <h3 className="font-display font-bold text-base text-white line-clamp-1 group-hover:text-primary transition-colors duration-200">{property.title}</h3>
                  <p className="text-xs text-muted flex items-center gap-1 truncate">
                    <MapPin size={12} className="text-primary/70 shrink-0" /> {getCity(property)}, {getState(property)}
                  </p>
                  <p className="text-lg font-display font-black text-primary leading-none">{getPrice(property)}</p>
                </div>
                <Link to={`/properties/${property.propertyId}`} className="w-fit px-4 py-2 bg-white/5 hover:bg-primary text-white hover:text-black rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border border-white/10 hover:border-primary">
                  View Property
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Properties */}
      <section className="bg-gradient-to-br from-dark-card/50 via-black/30 to-dark-card/50 border border-dark-border/80 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
        <div className="flex items-end justify-between border-b border-dark-border/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-widest">
              <Sparkles size={14} className="animate-pulse" /> Elite Collection
            </div>
            <h2 className="text-2xl font-display font-extrabold uppercase tracking-tight text-white">Featured Properties</h2>
          </div>
          <Link 
            to={ROUTES.PROPERTIES} 
            className="group text-xs font-bold text-primary hover:text-yellow-400 uppercase tracking-widest transition-colors flex items-center gap-1.5"
          >
            View All Properties <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        
        {featuredProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-6 border border-dashed border-dark-border/60 rounded-2xl bg-black/20 text-center space-y-4">
            <div className="p-4 bg-white/5 rounded-full text-muted border border-white/5 shadow-inner">
              <Compass size={28} />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-white font-bold text-base">No recommended properties</h3>
              <p className="text-muted text-xs leading-relaxed">
                We're tailoring exclusive listings. Browse all properties to explore available options.
              </p>
            </div>
            <Link 
              to={ROUTES.PROPERTIES} 
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs uppercase tracking-widest font-bold transition-all border border-white/10"
            >
              Explore Listings
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((property: any) => (
              <BuyerPropertyCard key={property.propertyId} property={property} />
            ))}
          </div>
        )}
      </section>

      {/* Purchased Properties */}
      {purchases.length > 0 && (
        <section className="bg-gradient-to-br from-dark-card/50 via-black/30 to-dark-card/50 border border-dark-border/80 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
          <div className="flex items-end justify-between border-b border-dark-border/60 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-widest">
                <CheckCircle size={14} /> Certified Ownership
              </div>
              <h2 className="text-2xl font-display font-extrabold uppercase tracking-tight text-white">Purchased Properties</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(purchases as any[]).map((purchase: any) => (
              <div 
                key={purchase.purchaseId} 
                className="relative overflow-hidden bg-gradient-to-br from-black/80 via-[#0A0A0A] to-black/95 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-6 group transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_rgba(16,185,129,0.03)] shadow-xl"
              >
                {/* Glowing radial backglow */}
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/8 transition-all duration-300 pointer-events-none" />
                
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="space-y-1.5">
                    <h3 className="font-display font-bold text-base text-white line-clamp-1 group-hover:text-emerald-300 transition-colors leading-tight">{purchase.propertyTitle || 'Property'}</h3>
                    <div className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border border-emerald-500/25">
                      <CheckCircle size={10} /> Acquired Asset
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-full bg-emerald-500/5 flex items-center justify-center border border-emerald-500/15 text-emerald-400 shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-inner overflow-hidden">
                    {purchase.property?.images?.[0] ? (
                      <img src={purchase.property.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 size={20} />
                    )}
                  </div>
                </div>
                
                <div className="space-y-3 mt-4 text-xs">
                  <div className="flex justify-between items-center border-b border-dark-border/40 pb-2.5">
                    <span className="text-muted/70 font-bold uppercase tracking-wider flex items-center gap-1.5 text-[9px]">
                      <Calendar size={12} className="text-emerald-400/70" /> Purchase Date
                    </span>
                    <span className="text-white font-semibold">{new Date(purchase.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-dark-border/40 pb-2.5">
                    <span className="text-muted/70 font-bold uppercase tracking-wider flex items-center gap-1.5 text-[9px]">
                      <DollarSign size={12} className="text-emerald-400/70" /> Transaction ID
                    </span>
                    <span className="text-white font-mono font-semibold truncate max-w-[150px] bg-white/5 px-2 py-0.5 rounded border border-white/5 text-[10px]" title={purchase.purchaseId}>
                      {purchase.purchaseId}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Grid Layout for Auctions and Bids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Trending Live Auctions */}
        <section className="bg-gradient-to-br from-dark-card/50 via-black/30 to-dark-card/50 border border-dark-border/80 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 hover:border-primary/20 transition-all duration-500">
          <div className="flex items-end justify-between border-b border-dark-border/60 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Live Action
              </div>
              <h2 className="text-2xl font-display font-extrabold uppercase tracking-tight text-white">Trending Auctions</h2>
            </div>
            <Link 
              to={ROUTES.BUYER_AUCTIONS} 
              className="group text-xs font-bold text-primary hover:text-yellow-400 uppercase tracking-widest transition-colors flex items-center gap-1.5"
            >
              View All <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          
          {enrichedTrending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 border border-dashed border-dark-border/60 rounded-2xl bg-black/20 text-center space-y-4">
              <div className="p-4 bg-white/5 rounded-full text-muted border border-white/5 shadow-inner">
                <Gavel size={26} className="rotate-12" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-white font-bold text-base">No live auctions</h3>
                <p className="text-muted text-xs leading-relaxed">
                  There are no live real estate auctions running at the moment.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {enrichedTrending.map((auction: any) => (
                <AuctionCard key={auction.auctionId} auction={auction} />
              ))}
            </div>
          )}
        </section>

        {/* Your Active Bids */}
        <section className="bg-gradient-to-br from-dark-card/50 via-black/30 to-dark-card/50 border border-dark-border/80 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 hover:border-primary/20 transition-all duration-500">
          <div className="flex items-end justify-between border-b border-dark-border/60 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                <TrendingUp size={14} className="text-primary" /> Real-time Tracker
              </div>
              <h2 className="text-2xl font-display font-extrabold uppercase tracking-tight text-white">Your Active Bids</h2>
            </div>
            <Link 
              to={ROUTES.BUYER_BIDS} 
              className="group text-xs font-bold text-primary hover:text-yellow-400 uppercase tracking-widest transition-colors flex items-center gap-1.5"
            >
              Manage Bids <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          
          {mappedBids.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 border border-dashed border-dark-border/60 rounded-2xl bg-black/20 text-center space-y-4">
              <div className="p-4 bg-white/5 rounded-full text-muted border border-white/5 shadow-inner">
                <Gavel size={26} className="rotate-12" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-white font-bold text-base">No Active Bids</h3>
                <p className="text-muted text-xs leading-relaxed">
                  You haven't bid on any listings yet. Discover upcoming and live property auctions to start bidding.
                </p>
              </div>
              <Link 
                to={ROUTES.BUYER_AUCTIONS} 
                className="px-5 py-2.5 bg-primary hover:bg-yellow-400 text-black rounded-lg text-xs uppercase tracking-widest font-bold transition-all hover:shadow-gold"
              >
                View Live Auctions
              </Link>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-black/80 via-[#0A0A0A] to-black/95 border border-dark-border rounded-2xl overflow-hidden shadow-2xl transition-all duration-300">
              <BidTable bids={mappedBids.slice(0, 5)} />
            </div>
          )}
        </section>
      </div>

    </div>
  );
}
