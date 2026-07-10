import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSellerAuction, scheduleSellerAuction,
  getSellerAuctionBids, getInterestedBuyers, getSellerProperties,
  earlyCloseAuction
} from '../../../services/sellerService';
import { formatPrice, formatDateTime } from '../../../utils/formatters';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useAuctionStore } from '../../../store/auctionStore';
import type { Bid, CreateAuctionPayload } from '../../../types/auction.types';
import {
  ArrowLeft, Gavel, Activity, Users, TrendingUp,
  CheckCircle, Building2, MapPin, Loader2,
  CalendarClock, DollarSign, Target, StopCircle, Sparkles
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getCity  = (p: any) => p.city  ?? p.location?.city  ?? '—';
const getState = (p: any) => p.state ?? p.location?.state ?? '—';

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  scheduled: { label: 'Scheduled', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.05)]' },
  live:       { label: 'Live',      cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)] animate-pulse' },
  active:     { label: 'Live',      cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)] animate-pulse' },
  completed:  { label: 'Closed',    cls: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
  ended:      { label: 'Closed',    cls: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
  cancelled:  { label: 'Cancelled', cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
};

const inputCls = 'w-full bg-black/60 border border-dark-border/80 rounded-xl px-4 py-3 text-white placeholder-muted focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all duration-200';
const labelCls = 'block text-[10px] font-bold text-muted/80 uppercase tracking-widest mb-2';

// ─── Live Auction Remaining Time Countdown ───────────────────────────────────
function LiveCountdown({ endTime }: { endTime: string }) {
  const calc = () => Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000));
  const [secs, setSecs] = useState(calc);

  useEffect(() => {
    if (secs <= 0) return;
    const id = setInterval(() => setSecs(calc), 1000);
    return () => clearInterval(id);
  });

  if (secs <= 0) return <span className="text-red-400 font-bold uppercase tracking-wider">Ended</span>;

  const days = Math.floor(secs / (24 * 3600));
  const hours = Math.floor((secs % (24 * 3600)) / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;

  if (days > 0) {
    return <span className="font-mono text-white">{days}d {hours}h {minutes}m</span>;
  }
  return (
    <span className="font-mono text-white tracking-wider">
      {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  );
}

// ─── Create Auction Form (inline, when no auction exists yet) ─────────────────
interface CreateFormProps { propertyId: string; onSuccess: () => void }

function CreateAuctionForm({ propertyId, onSuccess }: CreateFormProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ startingPrice: '', reservePrice: '', bidIncrement: '', startTime: '', endTime: '' });
  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: CreateAuctionPayload) => scheduleSellerAuction(propertyId, payload),
    onSuccess: () => {
      toast.success('Auction created successfully!');
      queryClient.invalidateQueries({ queryKey: ['sellerAuction', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'auctions'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'properties'] });
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message ?? 'Failed to create auction');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sp = Number(form.startingPrice);
    const rp = Number(form.reservePrice);
    const bi = Number(form.bidIncrement);
    const st = new Date(form.startTime);
    const et = new Date(form.endTime);

    if (!sp || !rp || !bi || !form.startTime || !form.endTime) return toast.error('All fields are required');
    if (st <= new Date()) return toast.error('Start date cannot be in the past');
    if (et <= st) return toast.error('End date must be after start date');
    if (rp < sp) return toast.error('Reserve price must be ≥ starting price');
    if (bi <= 0) return toast.error('Bid increment must be greater than 0');

    mutate({ startingPrice: sp, reservePrice: rp, bidIncrement: bi, startTime: st.toISOString(), endTime: et.toISOString() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Starting Price (₹)</label>
          <input className={inputCls} type="number" min="1" placeholder="e.g. 5000000" value={form.startingPrice} onChange={e => setF('startingPrice', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Reserve Price (₹)</label>
          <input className={inputCls} type="number" min="1" placeholder="e.g. 6000000" value={form.reservePrice} onChange={e => setF('reservePrice', e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Bid Increment (₹)</label>
        <input className={inputCls} type="number" min="1" placeholder="e.g. 50000" value={form.bidIncrement} onChange={e => setF('bidIncrement', e.target.value)} />
        <p className="text-[10px] text-muted/70 mt-1.5 leading-relaxed">Minimum amount each new bid must exceed the previous.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Start Date & Time</label>
          <input className={`${inputCls} cursor-pointer`} type="datetime-local" value={form.startTime} onChange={e => setF('startTime', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>End Date & Time</label>
          <input className={`${inputCls} cursor-pointer`} type="datetime-local" value={form.endTime} onChange={e => setF('endTime', e.target.value)} />
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-black font-bold rounded-xl hover:bg-yellow-400 transition-all hover:shadow-gold active:scale-95 disabled:opacity-40 disabled:pointer-events-none uppercase tracking-widest text-xs"
      >
        {isPending ? <><Loader2 size={18} className="animate-spin" /> Creating...</> : <><Gavel size={18} /> Create Auction</>}
      </button>
    </form>
  );
}

// ─── Early-Close Countdown Button ────────────────────────────────────────────
function EarlyCloseCountdown({ endTime }: { endTime: string }) {
  const calc = () => Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000));
  const [secs, setSecs] = useState(calc);

  useEffect(() => {
    if (secs <= 0) return;
    const id = setInterval(() => setSecs(calc), 1000);
    return () => clearInterval(id);
  });

  if (secs <= 0) return <span className="font-mono font-black tracking-widest">Closing…</span>;

  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  return (
    <span className="inline-flex items-center gap-2 font-bold uppercase tracking-wider text-xs">
      <StopCircle size={15} className="shrink-0" />
      Auction closing in
      <span
        className="font-mono font-black text-sm tracking-widest px-2 py-0.5 rounded"
        style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
      >
        {mm}:{ss}
      </span>
    </span>
  );
}

// ─── Stat Mini Card ───────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: any; icon: any; color: string }) {
  return (
    <div className="p-4 bg-black/30 border border-dark-border rounded-xl">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-[#0A0A0A] border border-dark-border/60 ${color}`}>
        <Icon size={16} />
      </div>
      <p className="text-xl font-display font-extrabold mb-0.5 text-white">{value}</p>
      <p className="text-[9px] text-muted/80 font-bold uppercase tracking-widest">{label}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SellerAuctionManagementPage() {
  const { id: propertyId } = useParams<{ id: string }>();

  // Property info from seller's property list
  const { data: properties = [] } = useQuery({
    queryKey: ['seller', 'properties'],
    queryFn: getSellerProperties,
  });
  const property = (properties as any[]).find(p => p.propertyId === propertyId);

  // Auction details for this property
  const { data: auction, isLoading: auctionLoading, refetch: refetchAuction } = useQuery({
    queryKey: ['sellerAuction', propertyId],
    queryFn: () => getSellerAuction(propertyId!),
    enabled: !!propertyId,
  });

  // Track end-time after early-close so the countdown button can render
  const [earlyCloseEndTime, setEarlyCloseEndTime] = useState<string | null>(null);

  const { mutate: closeEarly, isPending: closingEarly } = useMutation({
    mutationFn: () => earlyCloseAuction(propertyId!),
    onSuccess: (res) => {
      const serverEnd = res?.newEndTime;
      if (serverEnd) setEarlyCloseEndTime(serverEnd);
      toast.success('Auction scheduled to close early (15 mins remaining)');
      refetchAuction();
    },
    onError: (err: any) => {
      setEarlyCloseEndTime(null);
      toast.error(err.response?.data?.error?.message || 'Failed to close auction early');
    }
  });

  // Bids — fetch initially for fallback
  const { data: initialBids } = useQuery<Bid[]>({
    queryKey: ['sellerAuctionBids', propertyId],
    queryFn: () => getSellerAuctionBids(propertyId!),
    enabled: !!auction?.auctionId,
  });

  const { currentAuction, setAuction, connectToAuction, disconnectFromAuction, bidHistory, setBidHistory } = useAuctionStore();

  useEffect(() => {
    if (auction) setAuction(auction);
  }, [auction, setAuction]);

  useEffect(() => {
    if (initialBids) {
      setBidHistory(initialBids);
    }
  }, [initialBids, setBidHistory]);

  useEffect(() => {
    if (auction?.auctionId) {
      connectToAuction(auction.auctionId);
      return () => disconnectFromAuction(auction.auctionId);
    }
  }, [auction?.auctionId, connectToAuction, disconnectFromAuction]);

  const activeAuction = currentAuction || auction;
  const bids = bidHistory.length > 0 ? bidHistory : (initialBids || []);

  // Interested buyers
  const { data: buyers = [] } = useQuery({
    queryKey: ['interestedBuyers', propertyId],
    queryFn: () => getInterestedBuyers(propertyId!),
    enabled: !!propertyId,
  });

  if (auctionLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const statusCfg = activeAuction ? (STATUS_CFG[activeAuction.status] ?? STATUS_CFG.scheduled) : null;
  const isLive = activeAuction?.status === 'live';
  const highestBid = bids.length > 0 ? Math.max(...bids.map((b: Bid) => b.amount)) : 0;
  const highestBidder = bids.find((b: Bid) => b.amount === highestBid);
  const totalBids = bids.length;

  return (
    <div className="min-h-screen text-white bg-dark pb-16 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute right-0 top-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-1/4 bottom-1/4 w-72 h-72 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-dark-card via-black to-dark-card border-b border-dark-border p-6 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10">
        <div className="max-w-6xl mx-auto space-y-6">
          <Link
            to="/seller/auctions"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-white uppercase tracking-wider transition-colors"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary uppercase tracking-widest">
                  <Sparkles size={11} className="animate-pulse" /> Live Room
                </div>
                {statusCfg && (
                  <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-0.5 rounded-md border uppercase tracking-wider ${statusCfg.cls}`}>
                    {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                    {statusCfg.label}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight text-white leading-tight">
                {property?.title ?? `Property ${propertyId?.slice(0, 8)}…`}
              </h1>
              {property && (
                <p className="text-muted text-xs font-medium tracking-wide flex items-center gap-1.5">
                  <MapPin size={13} className="text-primary/70 shrink-0" /> {getCity(property)}, {getState(property)}
                </p>
              )}
            </div>
          </div>

          {/* Quick Header Indicators */}
          {activeAuction && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
              <div>
                <p className="text-[9px] text-muted uppercase tracking-wider font-bold mb-1">Current Highest Bid</p>
                <p className="text-3xl font-display font-black text-primary tracking-tight">
                  {formatPrice(activeAuction.currentHighestBid || activeAuction.startingPrice)}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-muted uppercase tracking-wider font-bold mb-1">Reserve Status</p>
                <p className={`text-sm font-extrabold mt-1.5 uppercase tracking-wider ${
                  activeAuction.currentHighestBid >= activeAuction.reservePrice ? 'text-emerald-400' : 'text-orange-400'
                }`}>
                  {activeAuction.currentHighestBid >= activeAuction.reservePrice ? '✓ Reserve Met' : '⚠ Reserve Unmet'}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-muted uppercase tracking-wider font-bold mb-1">Time Remaining</p>
                <div className="text-sm font-extrabold text-white mt-1.5">
                  {activeAuction.status === 'live' ? (
                    <LiveCountdown endTime={activeAuction.endTime} />
                  ) : activeAuction.status === 'scheduled' ? (
                    <span className="text-blue-400 font-bold uppercase tracking-wider">Starts soon</span>
                  ) : (
                    <span className="text-muted font-bold uppercase tracking-wider">Closed</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-12 py-10 relative z-10 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Auction Config / Create Form */}
            <div className="bg-dark-card/45 backdrop-blur-md border border-dark-border rounded-2xl p-6 md:p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-8 border-b border-dark-border/60 pb-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Gavel size={18} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-white">Auction Configuration</h2>
                  <p className="text-muted text-xs mt-0.5">{auction ? 'Current auction details and parameters' : 'Set up your auction settings'}</p>
                </div>
              </div>

              {!activeAuction ? (
                <CreateAuctionForm propertyId={propertyId!} onSuccess={() => refetchAuction()} />
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatCard label="Starting Price" value={formatPrice(activeAuction.startingPrice)} icon={DollarSign} color="text-muted/80" />
                    <StatCard label="Reserve Price" value={formatPrice(activeAuction.reservePrice)} icon={Target} color="text-yellow-400" />
                    <StatCard label="Bid Increment" value={formatPrice(activeAuction.bidIncrement ?? 0)} icon={TrendingUp} color="text-secondary" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-black/30 border border-dark-border rounded-xl">
                      <p className="text-[10px] text-muted/80 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <CalendarClock size={12} className="text-primary/70" /> Start Time
                      </p>
                      <p className="font-extrabold text-white text-sm">{activeAuction.startTime ? formatDateTime(activeAuction.startTime) : '—'}</p>
                    </div>
                    <div className="p-4 bg-black/30 border border-dark-border rounded-xl">
                      <p className="text-[10px] text-muted/80 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <CalendarClock size={12} className="text-primary/70" /> End Time
                      </p>
                      <p className="font-extrabold text-white text-sm">{activeAuction.endTime ? formatDateTime(activeAuction.endTime) : '—'}</p>
                    </div>
                  </div>

                  {['completed', 'ended'].includes(activeAuction.status) ? (
                    <div className="pt-4 border-t border-dark-border/60">
                      <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/5 text-muted font-bold text-xs uppercase tracking-widest shadow-inner">
                        <CheckCircle size={15} /> Auction Ended
                      </div>
                    </div>
                  ) : isLive && activeAuction.currentHighestBid >= activeAuction.reservePrice ? (
                    <div className="pt-4 border-t border-dark-border/60">
                      {(() => {
                        const countdownEnd = earlyCloseEndTime ?? activeAuction.endTime;
                        const isEarlyClosed = !!earlyCloseEndTime;

                        const handleClick = () => {
                           if (isEarlyClosed || closingEarly) return;
                           if (window.confirm('Are you sure you want to close this auction early? It will end in 15 minutes.')) {
                             const optimisticEnd = new Date(Date.now() + 15 * 60 * 1000).toISOString();
                             setEarlyCloseEndTime(optimisticEnd);
                             closeEarly();
                           }
                        };

                        return (
                          <button
                            onClick={handleClick}
                            disabled={closingEarly || isEarlyClosed}
                            className={`w-full flex items-center justify-center gap-2 py-3.5 border font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-xs
                              ${ isEarlyClosed
                                  ? 'bg-red-500/5 border-red-500/40 text-red-400 animate-pulse'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                              }`}
                          >
                            {isEarlyClosed ? (
                              <EarlyCloseCountdown endTime={countdownEnd} />
                            ) : closingEarly ? (
                              <><Loader2 size={16} className="animate-spin" /> Scheduling…</>
                            ) : (
                              <><StopCircle size={16} /> Close Auction Early (15 Mins)</>
                            )}
                          </button>
                        );
                      })()}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Bid History */}
            {activeAuction && (
              <div className="bg-dark-card/45 backdrop-blur-md border border-dark-border rounded-2xl p-6 md:p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6 border-b border-dark-border/60 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                      <Activity size={18} className="text-secondary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-bold text-white">Bid History</h2>
                      <p className="text-muted text-xs mt-0.5">{totalBids} bid{totalBids !== 1 ? 's' : ''} placed</p>
                    </div>
                  </div>
                  {isLive && (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full uppercase tracking-wider animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live
                    </span>
                  )}
                </div>

                {bids.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-dark-border rounded-2xl bg-black/20 space-y-3">
                    <div className="p-3 bg-white/5 rounded-full text-muted border border-white/5 w-fit mx-auto">
                      <Activity size={24} className="opacity-45" />
                    </div>
                    <p className="text-muted text-xs">No bids placed yet.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Highest bidder leader highlight */}
                    {highestBidder && (
                      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl shadow-[0_10px_30px_rgba(255,215,0,0.02)]">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                            <TrendingUp size={20} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-[10px] text-primary/80 font-bold uppercase tracking-widest">Highest Bid (Leader)</p>
                            <h4 className="font-extrabold text-white text-base mt-0.5">{highestBidder.bidderName ?? 'Unknown Bidder'}</h4>
                          </div>
                        </div>
                        <p className="text-2xl font-display font-black text-primary tracking-tight">{formatPrice(highestBid)}</p>
                      </div>
                    )}

                    {/* Bid table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-dark-border text-muted">
                            <th className="pb-3 font-semibold uppercase tracking-wider text-[10px] pl-2">#</th>
                            <th className="pb-3 font-semibold uppercase tracking-wider text-[10px]">Bidder</th>
                            <th className="pb-3 font-semibold uppercase tracking-wider text-[10px]">Amount</th>
                            <th className="pb-3 font-semibold uppercase tracking-wider text-[10px] text-right pr-2">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border/50">
                          {[...bids].reverse().map((bid: Bid, i) => (
                            <tr key={bid.bidId ?? i} className="hover:bg-white/5 transition-colors group">
                              <td className="py-3.5 text-muted text-xs pl-2 font-mono">{totalBids - i}</td>
                              <td className="py-3.5 font-bold text-white flex items-center gap-2">
                                <span>{bid.bidderName ?? 'Unknown Bidder'}</span>
                                {bid.amount === highestBid && (
                                  <span className="text-[8px] font-extrabold bg-primary/20 text-primary border border-primary/25 px-1.5 py-0.5 rounded uppercase tracking-wider">Top</span>
                                )}
                              </td>
                              <td className="py-3.5 font-extrabold text-primary">{formatPrice(bid.amount)}</td>
                              <td className="py-3.5 text-muted text-xs text-right pr-2 font-medium">
                                {bid.createdAt
                                  ? new Date(bid.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                  : bid.timestamp
                                  ? new Date(bid.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                  : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Property Preview */}
            {property && (
              <div className="bg-dark-card/45 border border-dark-border rounded-2xl overflow-hidden shadow-lg group">
                <div className="aspect-[16/10] relative bg-black overflow-hidden border-b border-dark-border">
                  {property.images?.[0] ? (
                    <img src={property.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-750 ease-out pointer-events-none" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted/60"><Building2 size={28} /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />
                </div>
                <div className="p-5">
                  <h3 className="font-display font-extrabold text-white text-base line-clamp-1 mb-1.5 group-hover:text-primary transition-colors duration-200">{property.title}</h3>
                  <p className="text-xs text-muted flex items-center gap-1.5 font-medium tracking-wide"><MapPin size={13} className="text-primary/70 shrink-0" /> {getCity(property)}, {getState(property)}</p>
                </div>
              </div>
            )}

            {/* Auction Stats */}
            {activeAuction && (
              <div className="bg-dark-card/45 border border-dark-border rounded-2xl p-6 shadow-md">
                <div className="flex items-center gap-2 mb-5 border-b border-dark-border/60 pb-4">
                  <CheckCircle size={15} className="text-secondary" />
                  <h3 className="font-display font-bold text-white text-sm uppercase tracking-wide">Auction Stats</h3>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: 'Highest Bid', value: formatPrice(activeAuction.currentHighestBid || activeAuction.startingPrice) },
                    { label: 'Starting Price', value: formatPrice(activeAuction.startingPrice) },
                    { label: 'Reserve Price', value: formatPrice(activeAuction.reservePrice) },
                    { label: 'Total Bids', value: totalBids },
                    { label: 'Unique Bidders', value: new Set(bids.map((b: Bid) => b.bidderId ?? b.userId)).size },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-dark-border/40 last:border-0">
                      <span className="text-xs text-muted font-medium">{item.label}</span>
                      <span className="text-xs font-bold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interested Buyers */}
            <div className="bg-dark-card/45 border border-dark-border rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-2 mb-5 border-b border-dark-border/60 pb-4">
                <Users size={15} className="text-primary" />
                <h3 className="font-display font-bold text-white text-sm uppercase tracking-wide">Interested Buyers</h3>
                <span className="ml-auto text-[10px] font-bold bg-white/5 border border-white/5 text-muted px-2 py-0.5 rounded">{(buyers as any[]).length}</span>
              </div>
              {(buyers as any[]).length === 0 ? (
                <p className="text-xs text-muted text-center py-6 font-medium">No prospective buyers yet.</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {(buyers as any[]).map((b: any) => (
                    <div key={b.userId} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-dark-border/80 hover:border-primary/20 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                        <Users size={12} className="text-muted/70" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-white truncate">{b.name}</p>
                        <p className="text-[10px] text-muted truncate mt-0.5 font-medium">{b.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Card / Timeline Rules */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-primary/5 rounded-full blur-xl pointer-events-none" />
              <h3 className="font-bold text-primary mb-3 text-xs uppercase tracking-wider flex items-center gap-1.5"><Sparkles size={13} /> Seller Guidelines</h3>
              <ul className="text-xs text-white/70 space-y-2.5 leading-relaxed">
                {[
                  'Starting price defines the opening bid threshold.',
                  'Reserve price is the minimum value required to close and sell.',
                  'Bid increments prevent minor bid wars and keep momentum.',
                  'System auto-extends bid timer if a bid is placed in the final minutes.',
                  'Winning bidder is locked into the final bid price at closing.',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span className="text-[11px] font-medium leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
