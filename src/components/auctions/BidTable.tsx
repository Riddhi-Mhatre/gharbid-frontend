import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import { formatShortPrice } from '../../utils/formatters';
import { Gavel, Calendar } from 'lucide-react';

interface Bid {
  id: string;
  propertyTitle: string;
  image: string;
  currentBid: number;
  myBid: number;
  status: 'winning' | 'outbid' | 'ending-soon' | 'pending';
  auctionEnd: string;
}

interface BidTableProps {
  bids: Bid[];
}

export function BidTable({ bids }: BidTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'winning': 
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.15)]';
      case 'outbid': 
        return 'text-red-400 bg-red-500/10 border-red-500/25 shadow-[0_0_15px_rgba(239,68,68,0.15)]';
      case 'pending':
      case 'ending-soon': 
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25 shadow-[0_0_15px_rgba(234,179,8,0.15)]';
      default: 
        return 'text-muted bg-white/5 border-dark-border';
    }
  };

  if (bids.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-5 border border-dashed border-dark-border/80 rounded-2xl bg-black/25">
        <div className="p-4 bg-white/5 rounded-full text-muted border border-white/5 shadow-inner">
          <Gavel size={32} className="rotate-12 opacity-45 text-primary/70 animate-pulse" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h3 className="text-white font-display font-bold text-lg">No Active Bids Placed</h3>
          <p className="text-muted text-xs leading-relaxed">
            You haven't placed any bids yet. Discover live property auctions to start bidding on verified estates.
          </p>
        </div>
        <div className="pt-2">
          <Link 
            to={ROUTES.BUYER_AUCTIONS} 
            className="inline-block px-6 py-3 bg-gradient-to-r from-primary to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-extrabold uppercase tracking-widest text-[10px] rounded-xl shadow-[0_0_15px_rgba(255,215,0,0.15)] hover:shadow-[0_0_25px_rgba(255,215,0,0.25)] transition-all duration-300 active:scale-95"
          >
            Discover Auctions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto w-full rounded-2xl border border-dark-border/80 hover:border-primary/20 bg-gradient-to-br from-black/80 via-[#0A0A0A] to-black/95 backdrop-blur-xl shadow-2xl shadow-black/80 transition-all duration-300">
        <table className="w-full text-left border-collapse min-w-[800px] font-sans">
          <thead>
            <tr className="border-b border-dark-border/80 text-muted/70 text-[10px] font-extrabold uppercase tracking-widest bg-black/80">
              <th className="py-5 px-6 font-semibold">Property</th>
              <th className="py-5 px-6 font-semibold">Current Bid</th>
              <th className="py-5 px-6 font-semibold">My Bid</th>
              <th className="py-5 px-6 font-semibold">Status</th>
              <th className="py-5 px-6 font-semibold">Auction End</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border/40">
            {bids.map((bid) => (
              <tr key={bid.id} className="hover:bg-white/[0.03] transition-all duration-300 group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-md group-hover:border-primary/20 transition-all">
                      <img src={bid.image} alt={bid.propertyTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <span className="font-bold text-white group-hover:text-primary transition-colors duration-250 text-sm leading-tight">{bid.propertyTitle}</span>
                  </div>
                </td>
                <td className="py-4 px-6 font-display font-black text-primary text-base select-none leading-none drop-shadow-[0_0_10px_rgba(255,215,0,0.05)]">
                  {formatShortPrice(bid.currentBid)}
                </td>
                <td className="py-4 px-6 font-display font-bold text-white/90 text-sm select-none leading-none">
                  {formatShortPrice(bid.myBid)}
                </td>
                <td className="py-4 px-6">
                  <span className={`px-2.5 py-1 rounded border text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm shadow-md ${getStatusColor(bid.status)}`}>
                    {bid.status.replace('-', ' ')}
                  </span>
                </td>
                <td className="py-4 px-6 text-xs text-gray-300 font-semibold tracking-wide">
                  {bid.auctionEnd}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="block md:hidden space-y-4">
        {bids.map((bid) => (
          <div key={bid.id} className="relative overflow-hidden bg-gradient-to-br from-black/80 via-[#0A0A0A] to-black/95 border border-dark-border/80 rounded-2xl p-5 flex flex-col gap-4 shadow-lg hover:border-primary/20 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-md">
                <img src={bid.image} alt={bid.propertyTitle} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1.5 min-w-0 flex-1">
                <h4 className="font-bold text-white text-sm line-clamp-1 leading-tight">{bid.propertyTitle}</h4>
                <span className={`inline-block px-2.5 py-1 rounded border text-[8px] font-bold uppercase tracking-wider backdrop-blur-sm ${getStatusColor(bid.status)}`}>
                  {bid.status.replace('-', ' ')}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-t border-dark-border/40 pt-3.5">
              <div>
                <p className="text-[9px] text-muted uppercase tracking-widest font-bold mb-0.5">Current Bid</p>
                <p className="text-sm font-display font-black text-primary leading-none">{formatShortPrice(bid.currentBid)}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted uppercase tracking-widest font-bold mb-0.5">My Bid</p>
                <p className="text-sm font-display font-bold text-white/90 leading-none">{formatShortPrice(bid.myBid)}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[9px] text-gray-400 border-t border-dark-border/40 pt-3.5 font-bold uppercase tracking-wider">
              <Calendar size={11} className="text-primary/70" />
              <span>Ends: {bid.auctionEnd}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
