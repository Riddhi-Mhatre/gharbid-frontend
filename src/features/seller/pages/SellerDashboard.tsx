import { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Eye, 
  Clock, 
  CheckCircle, 
  ChevronRight, 
  MessageSquare, 
  Loader2, 
  X, 
  MapPin, 
  ArrowUpRight, 
  ShieldCheck,
  ShieldAlert,
  Sparkles 
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { getSellerDashboard, getSellerProperties } from '../../../services/sellerService';
import { getSellerInquiries } from '../../../services/inquiryService';
import { useNavigate } from 'react-router-dom';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const getCity = (p: any) => p.city ?? p.location?.city ?? '—';
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

const statusConfig: Record<string, { label: string; class: string }> = {
  verified: { label: 'Verified', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  approved: { label: 'Verified', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  pending: { label: 'Pending',  class: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  rejected: { label: 'Rejected', class: 'bg-red-500/10 text-red-400 border-red-500/20' },
  draft:    { label: 'Draft',    class: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  sold:     { label: 'Sold',     class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
};

export default function SellerDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showViewersModal, setShowViewersModal] = useState(false);

  const {
    data: dashboard,
    isLoading: dashLoading,
  } = useQuery({
    queryKey: ['seller', 'dashboard'],
    queryFn: getSellerDashboard,
  });

  const {
    data: properties = [],
    isLoading: propsLoading,
  } = useQuery({
    queryKey: ['seller', 'properties'],
    queryFn: getSellerProperties,
  });

  const {
    data: inquiries = [],
    isLoading: inqLoading,
  } = useQuery({
    queryKey: ['inquiries', 'seller'],
    queryFn: getSellerInquiries,
    enabled: !!user,
  });

  const totalInquiries = (inquiries as any[]).length;

  const stats = [
    {
      label: 'Total Listings',
      value: dashLoading ? '—' : String(dashboard?.totalProperties ?? 0),
      icon: Building2,
      color: 'text-primary',
      trend: '+12% Grow',
      progressClass: 'bg-primary w-[75%]',
      onClick: () => navigate('/seller/my-properties?filter=all'),
      glow: 'hover:shadow-[0_25px_50px_rgba(255,215,0,0.06)] hover:border-primary/40',
      iconGlow: 'shadow-[0_0_15px_rgba(255,215,0,0.15)] bg-primary/10 border-primary/20',
      badgeClass: 'bg-primary/10 text-primary border border-primary/20',
    },
    {
      label: 'Sold Properties',
      value: propsLoading ? '—' : String((properties as any[]).filter(p => p.status === 'sold').length),
      icon: CheckCircle,
      color: 'text-emerald-400',
      trend: '+4% Sold',
      progressClass: 'bg-emerald-400 w-[40%]',
      onClick: () => navigate('/seller/sold-properties'),
      glow: 'hover:shadow-[0_25px_50px_rgba(16,185,129,0.06)] hover:border-emerald-500/40',
      iconGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-emerald-500/10 border-emerald-500/20',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    },
    {
      label: 'Total Views',
      value: dashLoading ? '—' : String(dashboard?.totalViews ?? 0),
      icon: Eye,
      color: 'text-cyan-400',
      trend: '+18% Reach',
      progressClass: 'bg-cyan-400 w-[85%]',
      onClick: () => setShowViewersModal(true),
      glow: 'hover:shadow-[0_25px_50px_rgba(34,211,238,0.06)] hover:border-cyan-500/40',
      iconGlow: 'shadow-[0_0_15px_rgba(34,211,238,0.15)] bg-cyan-500/10 border-cyan-500/20',
      badgeClass: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    },
    {
      label: 'Total Inquiries',
      value: inqLoading ? '—' : String(totalInquiries),
      icon: MessageSquare,
      color: 'text-purple-400',
      trend: '+9% Rate',
      progressClass: 'bg-purple-400 w-[60%]',
      onClick: () => navigate('/seller/chat'),
      glow: 'hover:shadow-[0_25px_50px_rgba(192,132,252,0.06)] hover:border-purple-500/40',
      iconGlow: 'shadow-[0_0_15px_rgba(192,132,252,0.15)] bg-purple-500/10 border-purple-500/20',
      badgeClass: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    },
  ];

  // Aggregate viewers from all properties for the modal
  const allViewers = (properties as any[])
    .flatMap(p => p.viewers || [])
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const trendingData = (properties as any[])
    .slice(0, 5)
    .map((p: any) => ({
      name: p.title?.slice(0, 16) ?? 'Property',
      views: p.viewsCount ?? p.viewCount ?? 0,
    }));

  // Top Viewed Properties to feature
  const featuredProperties = (properties as any[])
    .filter(p => getStatus(p) !== 'sold')
    .sort((a, b) => (b.viewsCount ?? b.viewCount ?? 0) - (a.viewsCount ?? a.viewCount ?? 0))
    .slice(0, 3);

  return (
    <div className="min-h-screen text-white bg-[#030303] pb-16 font-sans">
      
      <div className="max-w-[1500px] mx-auto px-6 md:px-12 pt-10 space-y-10 animate-fade-in">

        {/* Hero Banner Outer Container with Glow */}
        <div className="relative group/hero">
          {/* Subtle gold ambient glow behind the card */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-yellow-600/2 rounded-3xl blur-3xl opacity-50 pointer-events-none" />

          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 p-8 md:p-12 min-h-[360px] flex flex-col lg:flex-row lg:items-center justify-between bg-gradient-to-br from-black via-black/95 to-primary/5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] gap-8 z-10">
            {/* Background luxury house image */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-35 group-hover/hero:scale-105 transition-transform duration-[6000ms] ease-out pointer-events-none z-0"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80')` }}
            />
            {/* Subtle overlay gradient to guarantee readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent pointer-events-none z-0" />

            {/* Floating glass verification badge */}
            {user?.isVerified ? (
              <div className="hidden md:flex absolute top-6 right-6 z-10 px-4 py-2 rounded-2xl border border-primary/30 bg-black/60 backdrop-blur-md items-center gap-2 shadow-lg shadow-[0_0_12px_rgba(255,215,0,0.02)]">
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[9px] font-bold text-primary uppercase tracking-widest font-sans">Verified Seller Accreditation</span>
              </div>
            ) : (
              <div className="hidden md:flex absolute top-6 right-6 z-10 px-4 py-2 rounded-2xl border border-red-500/30 bg-black/60 backdrop-blur-md items-center gap-2 shadow-lg">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest font-sans font-mono">Awaiting Document Approval</span>
              </div>
            )}

            {/* Left side content */}
            <div className="relative z-10 space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest">
                <Sparkles size={12} className="animate-pulse" /> Luxury Property Hub
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight text-white leading-normal md:leading-tight pb-1">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-400 to-yellow-600 font-extrabold inline-block pb-1">{user?.name?.split(' ')[0] || 'Seller'}</span>
              </h1>
              <p className="text-muted/80 font-light text-xs md:text-sm leading-relaxed max-w-md">
                Manage your premium real estate portfolio, track listing performance, schedule live auctions.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => navigate('/seller/add-property')}
                  className="px-6 py-3 bg-gradient-to-r from-primary to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all duration-300 shadow-md hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 border border-primary/20"
                >
                  <Plus size={14} /> New Listing
                </button>
                <button
                  onClick={() => navigate('/seller/my-properties?filter=all')}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all duration-300 border border-white/10 hover:border-white/20 hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 backdrop-blur-sm"
                >
                  <Building2 size={14} /> View Properties
                </button>
              </div>
            </div>

            {/* Right side floating glass widgets */}
            <div className="relative z-10 flex flex-col sm:flex-row lg:flex-col gap-4 w-full lg:w-auto shrink-0 lg:max-w-xs z-10">
              {/* Active Listings Card */}
              <div className="p-4 rounded-2xl border border-white/10 hover:border-primary/25 bg-black/75 backdrop-blur-md shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-inner">
                  <Building2 size={16} />
                </div>
                <div>
                  <p className="text-[9px] text-muted uppercase tracking-wider font-semibold">Active Listings</p>
                  <p className="text-sm font-extrabold text-white">{dashLoading ? '—' : (dashboard?.totalProperties ?? 0)} Properties</p>
                </div>
              </div>

              {/* Live Auctions Card */}
              <div className="p-4 rounded-2xl border border-white/10 hover:border-emerald-500/25 bg-black/75 backdrop-blur-md shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-inner">
                  <CheckCircle size={16} />
                </div>
                <div>
                  <p className="text-[9px] text-muted uppercase tracking-wider font-semibold">Live Auctions</p>
                  <p className="text-sm font-extrabold text-white">
                    {propsLoading ? '—' : properties.filter((p: any) => getStatus(p) === 'approved' || getStatus(p) === 'verified').length} Live Rooms
                  </p>
                </div>
              </div>

              {/* Profile Verified Card */}
              <div className={`p-4 rounded-2xl border bg-black/75 backdrop-blur-md shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-3.5 ${
                user?.isVerified
                  ? 'border-white/10 hover:border-primary/25'
                  : 'border-red-500/20 hover:border-red-500/40'
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
                    {user?.isVerified ? 'Verified Account' : 'Action Required'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              onClick={stat.onClick}
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
            </div>
          ))}
        </div>

        {/* Charts & Timelines */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Chart Container */}
          <div className="lg:col-span-2 bg-gradient-to-br from-dark-card/60 via-black/40 to-dark-card/60 backdrop-blur-xl border border-dark-border/60 hover:border-primary/20 rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-primary/30 to-transparent" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="space-y-1">
                <h2 className="text-xl font-display font-extrabold text-white tracking-tight">Listing Performance</h2>
                <p className="text-[9px] text-muted uppercase tracking-widest font-semibold">Total unique views per property</p>
              </div>
              
              <div className="flex items-center gap-3 self-start sm:self-auto">
                {/* Legend */}
                <div className="hidden sm:flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-muted/80">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-primary" />
                    <span>Top Listing</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-amber-600" />
                    <span>Active Listings</span>
                  </div>
                </div>

                {/* Small filter dropdown placeholder */}
                <button type="button" className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[9px] font-bold text-white uppercase tracking-widest transition-all">
                  Last 30 Days
                </button>
              </div>
            </div>
            
            <div className="h-[280px] w-full pr-2">
              {propsLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendingData.length ? trendingData : [{ name: 'No data', views: 0 }]} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                    <XAxis dataKey="name" stroke="#444" tick={{ fill: '#888', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#444" tick={{ fill: '#888', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.02)', radius: 6 }}
                      contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: '#FFD700', fontWeight: 'bold' }}
                      labelStyle={{ color: '#9CA3AF', fontSize: 10 }}
                    />
                    <Bar dataKey="views" fill="#FFD700" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {
                        trendingData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#FFD700' : '#CCAC00'} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="bg-gradient-to-br from-dark-card/60 via-black/40 to-dark-card/60 border border-dark-border/60 hover:border-primary/20 shadow-xl transition-all duration-500 rounded-3xl p-6 md:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-8 border-b border-dark-border/60 pb-4">
              <h2 className="text-xl font-display font-extrabold text-white tracking-tight">Recent Activity</h2>
              <Clock size={16} className="text-primary/70" />
            </div>
            
            <div className="flex-1 space-y-6 overflow-y-auto pr-1 custom-scrollbar max-h-[280px]">
              {propsLoading ? (
                [1, 2, 3].map(i => <div key={i} className="h-14 bg-white/5 border border-white/5 rounded-xl animate-pulse" />)
              ) : (properties as any[]).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted opacity-50 py-12">
                  <Clock size={32} className="mb-2" />
                  <p className="text-xs">No recent activity</p>
                </div>
              ) : (
                (properties as any[]).slice(0, 4).map((prop: any, i) => (
                  <div key={i} className="flex gap-4 relative pl-2">
                    {i !== (properties as any[]).slice(0, 4).length - 1 && (
                      <div className="absolute left-[21px] top-9 bottom-[-24px] w-[1px] bg-dark-border/40" />
                    )}
                    
                    {/* Circle icon */}
                    <div className="w-8 h-8 rounded-full bg-black border border-primary flex items-center justify-center shrink-0 z-10 mt-1 shadow-[0_0_10px_rgba(255,215,0,0.15)]">
                      <Sparkles size={11} className="text-primary animate-pulse" />
                    </div>
                    
                    {/* Activity card */}
                    <div className="flex-1 p-3.5 rounded-xl border border-dark-border/50 bg-[#0A0A0A]/40 hover:border-primary/20 transition-all duration-300 shadow-md">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <p className="text-xs font-bold text-white">Property Verified</p>
                        {/* Timestamp badge */}
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[8px] font-bold text-muted uppercase tracking-widest font-mono">
                          {new Date(prop.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted line-clamp-1">{prop.title}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Featured Properties Section */}
        {featuredProperties.length > 0 && (
          <div className="bg-gradient-to-br from-dark-card/50 via-black/30 to-dark-card/50 border border-dark-border/80 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-dark-border/60 pb-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-display font-extrabold text-white tracking-tight">Featured Listings</h2>
                <p className="text-[10px] text-muted uppercase tracking-widest font-semibold">Your highest performing assets by profile views</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredProperties.map((property: any) => {
                const status = getStatus(property);
                const cfg = statusConfig[status] ?? statusConfig.pending;
                const isAuctionLive = property.isAuctionRequested || status === 'approved' || status === 'verified';
                
                return (
                  <div
                    key={property.propertyId}
                    onClick={() => navigate(`/properties/${property.propertyId}`)}
                    className="relative flex flex-col bg-[#0A0A0A]/60 border border-dark-border hover:border-primary/30 rounded-2xl overflow-hidden hover:-translate-y-1.5 hover:shadow-[0_25px_50px_rgba(255,215,0,0.03)] hover:border-primary/20 transition-all duration-500 cursor-pointer group"
                  >
                    <div className="relative aspect-[16/9] bg-black overflow-hidden border-b border-dark-border/60">
                      {property.images?.[0] ? (
                        <img src={property.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-750 ease-out" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted/65"><Building2 size={28} /></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      
                      <div className="absolute top-3 left-3 pointer-events-none z-10">
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider backdrop-blur-md shadow-md ${cfg.class}`}>
                          {cfg.label}
                        </span>
                      </div>
                      
                      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-[9px] font-bold text-white bg-black/60 border border-white/10 px-2 py-1 rounded-md backdrop-blur-md shadow-md pointer-events-none z-10">
                        <Eye size={11} className="text-primary shrink-0" /> {property.viewsCount ?? property.viewCount ?? 0}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <h3 className="font-display font-bold text-base text-white line-clamp-1 group-hover:text-primary transition-colors duration-200">{property.title}</h3>
                        <p className="text-xs text-muted flex items-center gap-1 font-medium truncate">
                          <MapPin size={12} className="text-primary/70 shrink-0" /> {getCity(property)}, {getState(property)}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <p className="text-2xl font-display font-black text-primary tracking-tight">{getPrice(property)}</p>
                        
                        {/* Specs Row */}
                        <div className="flex items-center justify-between text-[9px] text-muted/80 font-bold uppercase tracking-wider pt-3 border-t border-dark-border/40">
                          <span>{property.bedrooms || 0} Beds</span>
                          <span>•</span>
                          <span>{property.bathrooms || 0} Baths</span>
                          <span>•</span>
                          <span>{property.area || 0} Sq Ft</span>
                        </div>

                        {/* Auction Status Indicator */}
                        <div className="flex items-center justify-between pt-2 border-t border-dark-border/30">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-muted/70">Auction Status</span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            isAuctionLive ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_rgba(255,215,0,0.1)]' : 'bg-white/5 text-muted border border-white/5'
                          }`}>
                            {isAuctionLive ? 'Auction Active' : 'Not Scheduled'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Listings Section */}
        <div className="bg-gradient-to-br from-dark-card/50 via-black/30 to-dark-card/50 border border-dark-border/80 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-dark-border/60 pb-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-display font-extrabold text-white tracking-tight">Recent Listings</h2>
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Latest uploads from your portfolio</p>
            </div>
            <button
              onClick={() => navigate('/seller/my-properties?filter=all')}
              className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-yellow-400 transition-all group uppercase tracking-widest"
            >
              View All <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>

          {propsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="aspect-[4/5] bg-dark-card/40 border border-dark-border/60 rounded-2xl animate-pulse" />)}
            </div>
          ) : (properties as any[]).length === 0 ? (
            <div className="text-center py-16 border border-dashed border-dark-border/60 rounded-2xl bg-[#0A0A0A]/40 space-y-3">
              <Building2 size={36} className="mx-auto text-muted opacity-30 animate-pulse" />
              <p className="text-muted text-xs font-bold uppercase tracking-wider">No active listings listed</p>
              <button onClick={() => navigate('/seller/add-property')} className="text-primary text-xs uppercase tracking-widest font-extrabold hover:underline">
                Upload your first listing &rarr;
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {(properties as any[])
                .filter(p => getStatus(p) !== 'sold')
                .slice(0, 5)
                .map((property: any) => {
                  const status = getStatus(property);
                  const cfg = statusConfig[status] ?? statusConfig.pending;
                  return (
                    <div
                      key={property.propertyId}
                      onClick={() => navigate(`/properties/${property.propertyId}`)}
                      className="relative flex flex-col bg-dark-card/30 backdrop-blur-sm border border-dark-border/80 rounded-2xl overflow-hidden hover:border-primary/20 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_15px_30px_rgba(255,215,0,0.02)] cursor-pointer group"
                    >
                      <div className="relative aspect-[16/10] bg-black overflow-hidden border-b border-dark-border/60">
                        {property.images?.[0] ? (
                          <img src={property.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-750 ease-out" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted/65"><Building2 size={24} /></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                        
                        <div className="absolute top-2.5 left-2.5 pointer-events-none z-10">
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider backdrop-blur-md shadow-md ${cfg.class}`}>
                            {cfg.label}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <h3 className="font-display font-bold text-sm text-white line-clamp-1 group-hover:text-primary transition-colors duration-200">{property.title}</h3>
                          <p className="text-[10px] text-muted flex items-center gap-1 font-medium truncate">
                            <MapPin size={11} className="text-primary/70 shrink-0" /> {getCity(property)}, {getState(property)}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-lg font-display font-black text-primary tracking-tight">{getPrice(property)}</p>
                          <div className="flex items-center justify-between text-[9px] text-muted/80 font-bold uppercase tracking-wider pt-2.5 border-t border-dark-border/40">
                            <span>{property.bedrooms || 0} Beds</span>
                            <span>•</span>
                            <span>{property.bathrooms || 0} Baths</span>
                            <span>•</span>
                            <span>{property.area || 0} Sq Ft</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

      </div>

      {/* Viewers Modal */}
      {showViewersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0A0A0A] border border-dark-border rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-dark-border flex items-center justify-between bg-black/45">
              <div>
                <h2 className="text-2xl font-display font-bold text-white">Recent Profile Views</h2>
                <p className="text-xs text-muted mt-1">Users who have recently viewed your properties</p>
              </div>
              <button 
                onClick={() => setShowViewersModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {allViewers.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="p-4 bg-white/5 rounded-full text-muted border border-white/5 w-fit mx-auto">
                    <Eye size={36} className="opacity-40" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">No Viewer Data Yet</h3>
                    <p className="text-muted text-xs max-w-md mx-auto">
                      New viewer tracking has just been enabled. Future views from logged-in users will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {allViewers.map((viewer: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-dark-border/60 bg-black/40 hover:border-primary/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 shadow-inner">
                          <Eye size={16} className="text-secondary" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{viewer.viewerName}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted mt-0.5">
                            <MapPin size={10} className="text-primary/70" />
                            <span className="line-clamp-1">Viewed: {viewer.propertyTitle}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted font-bold">
                          {new Date(viewer.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] text-muted/70">
                          {new Date(viewer.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
