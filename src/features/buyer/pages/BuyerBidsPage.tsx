import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Wallet, Info, ArrowUpRight, Trophy, Activity, Sparkles } from 'lucide-react';
import { BidTable } from '../../../components/auctions/BidTable';
import { getBuyerBids } from '../../../services/userService';

export default function BuyerBidsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get('filter') || 'all';
  
  const { data: bids = [], isLoading } = useQuery({
    queryKey: ['buyer', 'bids-list-page'],
    queryFn: getBuyerBids,
  });

  // Deduplicate bids to only keep the highest bid per auction/property
  const highestBidsMap = new Map();
  for (const b of (bids as any[])) {
    const existing = highestBidsMap.get(b.auctionId || b.propertyId);
    if (!existing || b.myBid > existing.myBid) {
      highestBidsMap.set(b.auctionId || b.propertyId, b);
    }
  }
  const uniqueHighestBids = Array.from(highestBidsMap.values());

  const filteredBids = filter === 'won'
    ? uniqueHighestBids.filter((b: any) => (b.isWinner || b.status === 'won') && b.auctionStatus === 'completed')
    : filter === 'active'
    ? uniqueHighestBids.filter((b: any) => b.auctionStatus === 'live')
    : bids;

  const mappedBids = filteredBids.map((b: any) => ({
    id: b.bidId,
    propertyTitle: b.propertyName ?? 'Unknown Property',
    image: b.image || b.propertyImage || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=80&q=80',
    currentBid: b.currentHighestBid,
    myBid: b.myBid,
    status: b.status === 'won' ? 'winning' as const : b.status === 'lost' ? 'outbid' as const : b.status as any,
    auctionEnd: b.auctionEndTime ? new Date(b.auctionEndTime).toLocaleString('en-IN') : '—',
  }));

  const totalBidsCount = bids.length;
  const winningBidsCount = uniqueHighestBids.filter((b: any) => (b.isWinner || b.status === 'won') && b.auctionStatus === 'completed').length;
  const activeBidsCount = uniqueHighestBids.filter((b: any) => b.auctionStatus === 'live').length;

  const stats = [
    {
      id: 'all',
      label: 'Total Bids Placed',
      value: totalBidsCount,
      icon: Wallet,
      color: 'text-primary',
      glow: 'hover:shadow-[0_20px_40px_rgba(255,215,0,0.04)] hover:border-primary/30 border-primary/10',
      iconGlow: 'bg-primary/10 border-primary/20 text-primary',
      pct: 'w-[65%]',
      badge: 'All Bids',
    },
    {
      id: 'won',
      label: 'Auctions Won',
      value: winningBidsCount,
      icon: Trophy,
      color: 'text-emerald-400',
      glow: 'hover:shadow-[0_20px_40px_rgba(16,185,129,0.04)] hover:border-emerald-500/30 border-emerald-500/10',
      iconGlow: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      pct: 'w-[30%]',
      badge: 'Wins',
    },
    {
      id: 'active',
      label: 'Active Auctions',
      value: activeBidsCount,
      icon: Activity,
      color: 'text-rose-400',
      glow: 'hover:shadow-[0_20px_40px_rgba(244,63,94,0.04)] hover:border-rose-500/30 border-rose-500/10',
      iconGlow: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
      pct: 'w-[50%]',
      badge: 'In Progress',
    },
  ];

  return (
    <div className="space-y-10 animate-fade-in pb-16 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dark-border/40 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
            <Wallet size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-extrabold tracking-tight text-white leading-tight">
              {filter === 'won' ? 'Auctions Won' : filter === 'active' ? 'Active Auctions' : 'Bidding Control Console'}
            </h1>
            <p className="text-muted/70 text-xs mt-1">
              {filter === 'won' ? 'Verify and manage properties you have successfully won at auction.' : filter === 'active' ? 'Track and monitor your live bids.' : 'Track, monitor, and update your bids across active properties in real-time.'}
            </p>
          </div>
        </div>
      </div>

      {/* Overview stats */}
      {!isLoading && bids.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((s) => (
            <div
              key={s.label}
              onClick={() => setSearchParams({ filter: s.id })}
              className={`relative overflow-hidden cursor-pointer bg-gradient-to-br from-black/80 via-[#0A0A0A] to-black/95 backdrop-blur-xl border ${filter === s.id ? 'border-primary/40 shadow-2xl scale-[1.02]' : 'border-dark-border/40'} p-6 rounded-2xl transition-all duration-500 hover:-translate-y-1.5 group flex flex-col justify-between h-40 shadow-xl ${s.glow}`}
            >
              <div className="absolute -right-4 -top-4 opacity-[0.01] group-hover:opacity-[0.04] transition-opacity duration-500 pointer-events-none text-white">
                <s.icon size={85} />
              </div>
              <div className="flex justify-between items-start">
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-500 group-hover:scale-105 shadow-inner ${s.iconGlow}`}>
                  <s.icon size={16} />
                </div>
                <ArrowUpRight size={14} className="text-muted/65 group-hover:text-white transition-all" />
              </div>
              <div className="space-y-1">
                <span className="text-3xl font-display font-black text-white tracking-tight leading-none block">{s.value}</span>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1.5">
                  <div className={`h-full rounded-full ${s.color === 'text-primary' ? 'bg-primary' : s.color === 'text-emerald-400' ? 'bg-emerald-400' : 'bg-rose-400'} ${s.pct}`} />
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <p className="text-[9px] text-muted/60 font-bold uppercase tracking-widest">{s.label}</p>
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${
                    s.color === 'text-primary' ? 'bg-primary/10 text-primary border border-primary/20' : 
                    s.color === 'text-emerald-400' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {s.badge}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Table / List Box */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-36 gap-4">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 border-t-2 border-r-2 border-primary rounded-full animate-spin" />
          </div>
          <p className="text-muted/65 text-xs">Loading bidding records...</p>
        </div>
      ) : mappedBids.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-dark-border rounded-2xl bg-black/20 text-muted space-y-4">
          <div className="p-4 bg-white/5 rounded-full text-muted border border-white/5 w-fit mx-auto">
            <Info size={32} className="opacity-45" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-white text-lg">No Bids Found</h3>
            <p className="text-muted text-xs max-w-xs mx-auto">
              {filter === 'won' ? 'You have not won any auctions yet.' : "You haven't placed any bids on active property auctions yet."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-widest">
            <Sparkles size={13} className="animate-pulse" /> Active Bidding Ledger
          </div>
          <BidTable bids={mappedBids} />
        </div>
      )}
    </div>
  );
}
