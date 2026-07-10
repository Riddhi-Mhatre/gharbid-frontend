import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSellerAuctions, getSellerProperties, scheduleSellerAuction } from '../../../services/sellerService';
import { formatPrice } from '../../../utils/formatters';
import { toast } from 'sonner';
import type { Auction, CreateAuctionPayload } from '../../../types/auction.types';
import {
  Gavel, CheckCircle, Activity, TrendingUp,
  ArrowRight, X, Building2, MapPin, Plus, Loader2,
  CalendarClock, ShieldAlert, LayoutGrid, Sparkles,
  ArrowUpRight, IndianRupee, Info
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getCity  = (p: any) => p.city  ?? p.location?.city  ?? '—';
const getState = (p: any) => p.state ?? p.location?.state ?? '—';
const getPrice = (p: any) => {
  const raw = p.salePrice ?? p.rentPrice ?? p.price ?? 0;
  return raw ? `₹${Number(raw).toLocaleString('en-IN')}` : '—';
};

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  scheduled: { label: 'Scheduled', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.05)] animate-pulse' },
  live:       { label: 'Live Now',  cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)] animate-pulse' },
  active:     { label: 'Live Now',  cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)] animate-pulse' },
  completed:  { label: 'Closed',    cls: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
  ended:      { label: 'Closed',    cls: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
  cancelled:  { label: 'Cancelled', cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
};

// ─── Tab type ─────────────────────────────────────────────────────────────────
const TABS = ['All', 'Highest Bids', 'Scheduled', 'Live', 'Closed'] as const;
type Tab = typeof TABS[number];

// ─── Create Auction Modal ─────────────────────────────────────────────────────
interface CreateAuctionModalProps {
  property: any;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateAuctionModal({ property, onClose, onSuccess }: CreateAuctionModalProps) {
  const queryClient = useQueryClient();
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState({
    startingPrice: '',
    reservePrice: '',
    bidIncrement: '',
    startTime: '',
    endTime: '',
  });

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const { mutate, isPending } = useMutation({
    onSuccess: () => {
      toast.success('Auction created successfully!');
      queryClient.invalidateQueries({ queryKey: ['seller', 'auctions'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'properties'] });
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message ?? 'Failed to create auction');
    },
    mutationFn: (payload: CreateAuctionPayload) =>
      scheduleSellerAuction(property.propertyId, payload),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sp = Number(form.startingPrice);
    const rp = Number(form.reservePrice);
    const bi = Number(form.bidIncrement);
    const st = new Date(form.startTime);
    const et = new Date(form.endTime);

    if (!sp || !rp || !bi || !form.startTime || !form.endTime) {
      return toast.error('All fields are required');
    }
    if (st <= new Date()) {
      return toast.error('Start date cannot be in the past');
    }
    if (et <= st) {
      return toast.error('End date must be after start date');
    }
    if (rp < sp) {
      return toast.error('Reserve price must be ≥ starting price');
    }
    if (bi <= 0) {
      return toast.error('Bid increment must be greater than 0');
    }

    mutate({
      startingPrice: sp,
      reservePrice: rp,
      bidIncrement: bi,
      startTime: st.toISOString(),
      endTime: et.toISOString(),
    });
  };

  const inputCls = 'w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-muted focus:border-primary/60 focus:bg-primary/5 focus:outline-none focus:ring-1 focus:ring-primary/20 hover:border-white/20 transition-all duration-300 font-sans shadow-inner';
  const labelCls = 'block text-[10px] font-bold text-muted/80 uppercase tracking-widest mb-1.5 font-sans';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative z-10 w-full max-w-xl bg-gradient-to-br from-[#111] to-[#080808] border border-white/10 rounded-3xl p-1 shadow-[0_30px_80px_rgba(0,0,0,0.9),0_0_40px_rgba(255,215,0,0.05)] animate-slide-up overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="bg-[#0a0a0a]/90 backdrop-blur-2xl rounded-[22px] p-6 md:p-8 relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b border-white/5">
            <div>
              <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
                <Gavel size={12} className="text-primary animate-pulse" />
                <span className="text-[9px] text-primary font-bold uppercase tracking-widest">Schedule Auction</span>
              </div>
              <h2 className="text-3xl font-display font-extrabold text-white line-clamp-1 leading-tight tracking-tight">{property.title}</h2>
              <p className="text-xs text-muted mt-2 flex items-center gap-1.5 font-medium"><MapPin size={14} className="text-primary/70" /> {getCity(property)}, {getState(property)}</p>
            </div>
            <button 
              onClick={onClose} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:rotate-90 transition-all duration-300 text-muted hover:text-white shrink-0 shadow-lg"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="group">
                <label className={labelCls}>Starting Price</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors pointer-events-none">
                    <IndianRupee size={16} />
                  </div>
                  <input className={inputCls} type="number" min="1" placeholder="e.g. 5000000" value={form.startingPrice} onChange={e => setF('startingPrice', e.target.value)} />
                </div>
              </div>
              <div className="group">
                <label className={labelCls}>Reserve Price</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-emerald-400 transition-colors pointer-events-none">
                    <IndianRupee size={16} />
                  </div>
                  <input className={inputCls} type="number" min="1" placeholder="e.g. 6000000" value={form.reservePrice} onChange={e => setF('reservePrice', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="group">
              <label className={labelCls}>Bid Increment</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-blue-400 transition-colors pointer-events-none">
                  <TrendingUp size={16} />
                </div>
                <input className={inputCls} type="number" min="1" placeholder="e.g. 50000" value={form.bidIncrement} onChange={e => setF('bidIncrement', e.target.value)} />
              </div>
              <p className="text-[10px] text-muted/60 mt-2 flex items-center gap-1.5"><Info size={12} className="text-blue-400/70" /> Minimum amount each new bid must exceed the previous bid by.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div className="group" onClick={() => { try { startRef.current?.showPicker(); } catch(e){} }}>
                <label className={labelCls}>Start Date & Time</label>
                <div className="relative cursor-pointer">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary group-hover:text-primary transition-colors pointer-events-none">
                    <CalendarClock size={16} />
                  </div>
                  <input 
                    ref={startRef}
                    className={`${inputCls} cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden`} 
                    type="datetime-local" 
                    value={form.startTime} 
                    onChange={e => setF('startTime', e.target.value)} 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/30 group-hover:text-muted/60 transition-colors pointer-events-none">
                    <CalendarClock size={14} />
                  </div>
                </div>
              </div>
              
              <div className="group" onClick={() => { try { endRef.current?.showPicker(); } catch(e){} }}>
                <label className={labelCls}>End Date & Time</label>
                <div className="relative cursor-pointer">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-red-400 group-hover:text-red-400 transition-colors pointer-events-none">
                    <CalendarClock size={16} />
                  </div>
                  <input 
                    ref={endRef}
                    className={`${inputCls} cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden`} 
                    type="datetime-local" 
                    value={form.endTime} 
                    onChange={e => setF('endTime', e.target.value)} 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/30 group-hover:text-muted/60 transition-colors pointer-events-none">
                    <CalendarClock size={14} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-white/5">
              <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-xl border border-white/10 text-muted font-extrabold hover:text-white hover:bg-white/5 hover:border-white/20 transition-all text-[11px] uppercase tracking-widest hover:shadow-lg">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-primary via-yellow-400 to-yellow-600 hover:from-yellow-400 hover:via-yellow-300 hover:to-primary text-black font-extrabold text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-all duration-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none group"
              >
                {isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> Scheduling...</>
                ) : (
                  <>Schedule Auction <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Auction Row Card ─────────────────────────────────────────────────────────
interface AuctionListCardProps { auction: Auction; onManage: () => void }

function AuctionListCard({ auction, onManage }: AuctionListCardProps) {
  const cfg = STATUS_CFG[auction.status] ?? STATUS_CFG.scheduled;
  const isLive = auction.status === 'live';
  const bidsCount = auction.bids?.length ?? 0;

  return (
    <div className={`flex flex-col lg:flex-row lg:items-center justify-between p-6 bg-[#0A0A0A]/60 border border-dark-border/85 rounded-2xl hover:border-primary/30 transition-all duration-500 group gap-5 hover:shadow-[0_20px_45px_rgba(255,215,0,0.015)] ${
      isLive ? 'border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.01)]' : ''
    }`}>
      <div className="flex items-center gap-4 min-w-0">
        <div className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-all duration-300 ${
          isLive ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-white/5 border-white/5 text-muted group-hover:text-primary'
        }`}>
          <Gavel size={20} className="transition-colors" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] text-muted font-mono tracking-wider">{auction.propertyId.slice(0, 10)}…</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider backdrop-blur-sm shadow-md ${cfg.cls}`}>
              {isLive && <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />}
              {cfg.label}
            </span>
            <span className="text-[10px] font-bold text-muted/70 bg-white/5 px-2 py-0.5 rounded border border-white/5 tracking-wider uppercase">{bidsCount} bid{bidsCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 text-sm justify-between lg:justify-end">
        <div className="min-w-[100px]">
          <p className="text-[9px] text-muted uppercase tracking-wider font-bold mb-1">Current Bid</p>
          <p className="font-extrabold text-primary font-display text-base leading-none">{formatPrice(auction.currentHighestBid || auction.startingPrice || 0)}</p>
        </div>
        <div className="min-w-[85px]">
          <p className="text-[9px] text-muted uppercase tracking-wider font-bold mb-1 flex items-center gap-1"><CalendarClock size={11} /> Start</p>
          <p className="text-white text-xs font-semibold leading-none">{auction.startTime ? new Date(auction.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</p>
        </div>
        <div className="min-w-[85px]">
          <p className="text-[9px] text-muted uppercase tracking-wider font-bold mb-1 flex items-center gap-1"><CalendarClock size={11} /> End</p>
          <p className="text-white text-xs font-semibold leading-none">{auction.endTime ? new Date(auction.endTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</p>
        </div>
        <button
          onClick={onManage}
          className="flex items-center gap-1.5 text-[10px] font-extrabold text-primary hover:text-black hover:bg-primary transition-all duration-300 uppercase tracking-widest border border-primary/20 hover:border-primary bg-primary/5 px-5 py-2.5 rounded-xl self-end lg:self-auto shadow-md"
        >
          Manage <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Eligible Property Card ───────────────────────────────────────────────────
interface EligiblePropertyCardProps {
  property: any;
  onCreateAuction: () => void;
}

function EligiblePropertyCard({ property, onCreateAuction }: EligiblePropertyCardProps) {
  return (
    <div className="flex flex-col bg-dark-card/30 backdrop-blur-md border border-dark-border/80 hover:border-primary/20 rounded-2xl overflow-hidden group transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(255,215,0,0.02)] h-full shadow-lg">
      <div className="relative aspect-[16/10] bg-black overflow-hidden border-b border-dark-border/60">
        {property.images?.[0] ? (
          <img src={property.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-750 ease-out" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted/65"><Building2 size={32} /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
        <span className="absolute top-3 left-3 text-[9px] font-bold px-2.5 py-1 rounded-md border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 uppercase tracking-wider backdrop-blur-md shadow-md z-10 pointer-events-none">
          Approved Listing
        </span>
      </div>
      
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <h3 className="font-display font-bold text-base text-white line-clamp-1 group-hover:text-primary transition-colors duration-200">{property.title}</h3>
          <p className="text-xs text-muted flex items-center gap-1 font-medium truncate"><MapPin size={12} className="text-primary/70 shrink-0" /> {getCity(property)}, {getState(property)}</p>
        </div>
        <div className="space-y-3">
          <p className="text-2xl font-display font-black text-primary tracking-tight leading-none">{getPrice(property)}</p>
          <button
            onClick={onCreateAuction}
            className="w-full flex items-center justify-center gap-1.5 py-3 bg-gradient-to-r from-primary to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-extrabold uppercase tracking-widest text-[10px] rounded-xl shadow-[0_0_15px_rgba(255,215,0,0.15)] hover:shadow-[0_0_25px_rgba(255,215,0,0.25)] transition-all duration-300 active:scale-95"
          >
            <Plus size={14} /> Schedule Auction
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
  isLoading: boolean;
}

function StatCard({ label, value, icon: Icon, isActive, onClick, isLoading }: StatCardProps) {
  const accentGlow = 
    label === 'Active Auctions' || label === 'Live Now'
      ? 'hover:shadow-[0_25px_50px_rgba(16,185,129,0.06)] hover:border-emerald-500/40 border-emerald-500/20 text-emerald-400 bg-emerald-500/10'
      : label === 'Upcoming Auctions' || label === 'Scheduled'
      ? 'hover:shadow-[0_25px_50px_rgba(59,130,246,0.06)] hover:border-blue-500/40 border-blue-500/20 text-blue-400 bg-blue-500/10'
      : label === 'Completed Auctions' || label === 'Closed'
      ? 'hover:shadow-[0_25px_50px_rgba(156,163,175,0.06)] hover:border-gray-500/40 border-gray-500/20 text-gray-400 bg-gray-500/10'
      : 'hover:shadow-[0_25px_50px_rgba(255,215,0,0.06)] hover:border-primary/40 border-primary/20 text-primary bg-primary/10';

  const progressPct = 
    label === 'Active Auctions' || label === 'Live Now' ? 'w-[45%]' :
    label === 'Upcoming Auctions' || label === 'Scheduled' ? 'w-[30%]' :
    label === 'Completed Auctions' || label === 'Closed' ? 'w-[80%]' : 'w-[65%]';

  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden bg-gradient-to-br from-black/80 via-[#0A0A0A] to-black/95 backdrop-blur-xl border p-6 rounded-2xl transition-all duration-500 hover:-translate-y-2.5 cursor-pointer group flex flex-col justify-between h-44 shadow-2xl shadow-black/70 w-full text-left ${
        isActive
          ? 'border-primary shadow-[0_0_20px_rgba(255,215,0,0.15)] bg-primary/5'
          : 'border-dark-border/80 hover:border-primary/30'
      }`}
    >
      {/* Background icon watermark */}
      <div className="absolute -right-4 -top-4 opacity-[0.01] group-hover:opacity-[0.04] transition-opacity duration-500 pointer-events-none text-white">
        <Icon size={95} />
      </div>

      {/* Active indicator dot */}
      {isActive && (
        <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      )}

      <div className="flex justify-between items-start">
        <div className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-500 group-hover:scale-105 shadow-inner ${
          isActive ? 'bg-primary/20 border-primary/40 text-primary shadow-[0_0_15px_rgba(255,215,0,0.25)]' : accentGlow
        }`}>
          <Icon size={18} />
        </div>
        <ArrowUpRight size={15} className="text-muted/60 group-hover:text-white transition-all duration-300" />
      </div>

      <div className="space-y-2 w-full">
        <p className="text-3xl font-display font-black text-white tracking-tight leading-none block select-none">
          {isLoading ? '—' : value}
        </p>
        
        {/* Mini progress indicator */}
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1.5">
          <div className={`h-full rounded-full transition-all duration-1000 ${
            isActive ? 'bg-primary' : 
            label === 'Active Auctions' || label === 'Live Now' ? 'bg-emerald-400' :
            label === 'Upcoming Auctions' || label === 'Scheduled' ? 'bg-blue-400' :
            label === 'Completed Auctions' || label === 'Closed' ? 'bg-gray-400' : 'bg-primary'
          } ${progressPct}`} />
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <p className="text-[9px] text-muted/70 font-bold uppercase tracking-widest group-hover:text-muted/95 transition-colors">{label}</p>
          <span className={`text-[8px] font-bold px-2 py-0.5 rounded flex items-center shrink-0 shadow-sm ${
            isActive ? 'bg-primary/10 text-primary border border-primary/20' : 
            label === 'Active Auctions' || label === 'Live Now' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            label === 'Upcoming Auctions' || label === 'Scheduled' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
            label === 'Completed Auctions' || label === 'Closed' ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20' : 'bg-primary/10 text-primary border border-primary/20'
          }`}>
            {isActive ? 'Active filter' : 'Filter'}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function SellerAuctionDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [modalProperty, setModalProperty] = useState<any>(null);

  // Fetch all seller auctions
  const { data: auctionData, isLoading: auctionsLoading } = useQuery({
    queryKey: ['seller', 'auctions'],
    queryFn: getSellerAuctions,
  });

  // Fetch all seller properties to find eligible ones
  const { data: properties = [], isLoading: propsLoading } = useQuery({
    queryKey: ['seller', 'properties'],
    queryFn: getSellerProperties,
  });

  const stats = auctionData?.stats ?? { total: 0, active: 0, completed: 0, totalBids: 0, highestBid: 0, totalViews: 0 };
  const allAuctions: Auction[] = auctionData?.auctions ?? [];

  const scheduledCount = allAuctions.filter(a => a.status === 'scheduled').length;
  const liveCount      = allAuctions.filter(a => a.status === 'live').length;
  const closedCount    = allAuctions.filter(a => a.status === 'completed' || a.status === 'ended').length;

  // Properties eligible for auction
  const propertyIdsWithAuction = new Set(allAuctions.map(a => a.propertyId));
  const eligibleProperties = (properties as any[]).filter(p => {
    const status = p.status ?? p.verificationStatus;
    return (status === 'approved' || status === 'verified') && !p.isAuctionRequested && !propertyIdsWithAuction.has(p.propertyId);
  });

  // Filter auctions by active tab
  let filteredAuctions = allAuctions.filter(a => {
    const s = a.status;
    if (activeTab === 'All')       return true;
    if (activeTab === 'Scheduled') return s === 'scheduled';
    if (activeTab === 'Live')      return s === 'live';
    if (activeTab === 'Closed')    return s === 'completed' || s === 'ended' || s === 'cancelled';
    if (activeTab === 'Highest Bids') return a.currentHighestBid > 0;
    return true;
  });

  if (activeTab === 'Highest Bids') {
    filteredAuctions = filteredAuctions.sort((a, b) => (b.currentHighestBid || 0) - (a.currentHighestBid || 0));
  }

  // Stat cards — each maps to a tab filter
  const statCards = [
    {
      label: 'Total Auctions',
      value: allAuctions.length,
      icon: LayoutGrid,
      color: 'text-primary',
      tab: 'All' as Tab,
    },
    {
      label: 'Upcoming Auctions',
      value: scheduledCount,
      icon: CalendarClock,
      color: 'text-blue-400',
      tab: 'Scheduled' as Tab,
    },
    {
      label: 'Active Auctions',
      value: liveCount,
      icon: Activity,
      color: 'text-emerald-400',
      tab: 'Live' as Tab,
    },
    {
      label: 'Completed Auctions',
      value: closedCount,
      icon: CheckCircle,
      color: 'text-gray-400',
      tab: 'Closed' as Tab,
    },
    {
      label: 'Highest Bid',
      value: typeof stats.highestBid === 'number' ? formatPrice(stats.highestBid) : '₹0',
      icon: TrendingUp,
      color: 'text-primary',
      tab: 'Highest Bids' as Tab,
    },
  ];

  const isLoading = auctionsLoading || propsLoading;

  return (
    <div className="min-h-screen text-white bg-[#030303] pb-16 relative overflow-hidden font-sans">
      {/* Decorative Glows */}
      <div className="absolute right-0 top-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-1/4 bottom-1/4 w-72 h-72 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Outer Container with Glow */}
      <div className="max-w-[1500px] mx-auto px-6 md:px-12 pt-10">
        <div className="relative group/hero">
          {/* Subtle gold ambient glow behind the card */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-yellow-600/2 rounded-3xl blur-3xl opacity-50 pointer-events-none" />

          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 p-8 md:p-12 min-h-[340px] flex flex-col justify-between bg-gradient-to-br from-black via-black/95 to-primary/5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] group z-10">
            {/* Background luxury house image */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30 group-hover/hero:scale-105 transition-transform duration-[6000ms] ease-out pointer-events-none z-0"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80')` }}
            />
            {/* Subtle overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent pointer-events-none z-0" />

            {/* Content info */}
            <div className="relative z-10 space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest">
                <Sparkles size={12} className="animate-pulse" /> Live Control Center
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight text-white leading-tight">
                Auction Control Center
              </h1>
              <p className="text-muted/80 font-light text-xs md:text-sm leading-relaxed max-w-md">
                Manage live auctions, monitor bids, and control property bidding.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-6 md:px-12 mt-10 md:mt-12 space-y-12 relative z-10 animate-fade-in">

        {/* ── Stat Cards (clickable → filter) ──────────────────────────────── */}
        <div className="space-y-4">
          <p className="text-[10px] text-muted/60 font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles size={11} className="text-primary" /> Click any card to filter your auctions list below
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {statCards.map((s) => (
              <StatCard
                key={s.label}
                label={s.label}
                value={s.value}
                icon={s.icon}
                isActive={
                  s.label === 'Total Auctions'
                    ? activeTab === 'All'
                    : activeTab === s.tab
                }
                onClick={() => setActiveTab(s.tab)}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>

        {/* ── Properties Ready for Auction ─────────────────────────────────── */}
        {(eligibleProperties.length > 0 || propsLoading) && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-dark-border/40 pb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                <ShieldAlert size={18} className="text-primary animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-extrabold text-white tracking-tight">Approved Properties Inventory</h2>
                <p className="text-muted/70 text-xs mt-0.5">Eligible properties ready to be launched on live auctions</p>
              </div>
            </div>
            {propsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <div key={i} className="aspect-[16/10] w-full bg-dark-card border border-dark-border/60 rounded-2xl animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eligibleProperties.map((prop: any) => (
                  <EligiblePropertyCard
                    key={prop.propertyId}
                    property={prop}
                    onCreateAuction={() => setModalProperty(prop)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Auctions List (filtered) ──────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-dark-card/50 via-black/30 to-dark-card/50 border border-dark-border/80 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dark-border/60 pb-4">
            <div>
              <h2 className="text-2xl font-display font-extrabold text-white tracking-tight">Your Real-Time Auctions</h2>
              {activeTab !== 'All' && (
                <p className="text-xs text-muted mt-1.5 flex items-center gap-1.5">
                  Showing <span className="text-primary font-bold">{activeTab}</span> auctions
                  <span className="text-dark-border">•</span>
                  <button
                    onClick={() => setActiveTab('All')}
                    className="text-primary hover:text-yellow-400 underline underline-offset-2 transition-colors font-semibold"
                  >
                    Clear filter
                  </button>
                </p>
              )}
            </div>

            {/* Tab Pills */}
            <div className="flex flex-wrap gap-1 bg-black/45 border border-dark-border/80 rounded-xl p-1 w-fit self-start md:self-auto">
              {TABS.map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeTab === t 
                      ? 'bg-primary text-black shadow-md' 
                      : 'text-muted hover:text-white'
                  }`}
                >
                  {t}
                  {t !== 'All' && t !== 'Highest Bids' && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      activeTab === t ? 'bg-black/15 text-black' : 'bg-white/5 text-muted'
                    }`}>
                      {t === 'Scheduled' ? scheduledCount : t === 'Live' ? liveCount : closedCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Auction List */}
          {auctionsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-dark-border/40 rounded-2xl animate-pulse" />)}
            </div>
          ) : filteredAuctions.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-dark-border/80 rounded-2xl bg-black/20 space-y-4">
              <div className="p-4 bg-white/5 rounded-full text-muted border border-white/5 w-fit mx-auto shadow-inner">
                <Gavel size={32} className="opacity-45" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-display font-bold text-white">
                  No {activeTab !== 'All' ? activeTab : ''} Auctions Scheduled
                </h3>
                <p className="text-muted text-xs max-w-xs mx-auto">
                  {activeTab === 'All'
                    ? "You haven't scheduled any property auctions yet. Choose an approved property from the inventory above to begin."
                    : `There are currently no auctions categorized under ${activeTab.toLowerCase()}.`}
                </p>
              </div>
              {activeTab === 'All' && (
                <button
                  onClick={() => navigate('/seller/my-properties?filter=approved')}
                  className="bg-gradient-to-r from-primary to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-extrabold uppercase tracking-widest text-[10px] px-6 py-3.5 rounded-xl hover:shadow-gold transition-all active:scale-95"
                >
                  View Approved Properties
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAuctions.map((auction) => (
                <AuctionListCard
                  key={auction.auctionId}
                  auction={auction}
                  onManage={() => navigate(`/seller/auctions/${auction.propertyId}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Auction Modal */}
      {modalProperty && (
        <CreateAuctionModal
          property={modalProperty}
          onClose={() => setModalProperty(null)}
          onSuccess={() => { setModalProperty(null); navigate('/seller/auctions'); }}
        />
      )}
    </div>
  );
}
