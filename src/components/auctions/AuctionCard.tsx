import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Clock, Users, MapPin, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { formatPrice, formatCountdown } from '../../utils/formatters';
import type { AuctionWithProperty } from '../../types/auction.types';

interface AuctionCardProps {
  auction: AuctionWithProperty;
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(0);

  const property = auction.property;
  const image = property?.images?.[0] ?? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
  const title = property?.title ?? 'Luxury Property';
  const city = property?.city ?? property?.location?.city ?? 'Unknown';
  const state = property?.state ?? property?.location?.state ?? 'India';
  const sellerName = (property as any)?.sellerName ?? 'Verified Seller';
  const biddersCount = auction.totalBids ?? auction.bids?.length ?? 0;
  const verified = (property as any)?.isVerified || (property as any)?.verificationStatus === 'verified';

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      if (auction.status === 'scheduled') {
        return Math.max(0, new Date(auction.startTime).getTime() - now);
      }
      if (auction.status === 'live') {
        return Math.max(0, new Date(auction.endTime).getTime() - now);
      }
      return 0;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [auction]);

  const getStatusBadge = () => {
    switch (auction.status) {
      case 'scheduled':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider backdrop-blur-sm shadow-md">Scheduled</span>;
      case 'live':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider backdrop-blur-sm shadow-md flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Auction</span>;
      default:
        return <span className="bg-gray-500/10 text-gray-400 border border-gray-500/20 text-[9px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider backdrop-blur-sm shadow-md">Ended</span>;
    }
  };

  const getTimerText = () => {
    if (auction.status === 'scheduled') {
      return `Starts in: ${formatCountdown(timeLeft)}`;
    }
    if (auction.status === 'live') {
      return `Ends in: ${formatCountdown(timeLeft)}`;
    }
    return 'Auction Closed';
  };

  const currentBid = auction.currentHighestBid || auction.startingPrice || 0;

  return (
    <div className={`bg-[#0A0A0A]/60 backdrop-blur-md border rounded-2xl overflow-hidden group transition-all duration-500 hover:-translate-y-1.5 shadow-2xl hover:shadow-black/95 ${
      auction.status === 'live' 
        ? 'border-primary/30 shadow-[0_0_25px_rgba(255,215,0,0.04)] hover:border-primary/60 hover:shadow-[0_0_35px_rgba(255,215,0,0.08)]' 
        : 'border-dark-border/80 hover:border-primary/45 hover:shadow-[0_20px_45px_rgba(255,215,0,0.02)]'
    }`}>
      <div className="flex flex-col md:flex-row md:items-stretch">
        
        {/* Image Section */}
        <div className="md:w-[35%] min-h-[220px] md:min-h-auto relative overflow-hidden bg-black border-r border-dark-border/60">
          <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-750 ease-out group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/10 pointer-events-none" />
          
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap">
            {getStatusBadge()}
            {verified && (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider backdrop-blur-sm shadow-md flex items-center gap-1">
                <ShieldCheck size={11} /> Verified
              </span>
            )}
          </div>
          
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 text-white text-[10px] font-bold bg-black/70 border border-white/10 w-fit px-3 py-2 rounded-xl backdrop-blur-md shadow-lg shadow-black/40">
            <Clock size={12} className={auction.status === 'live' ? 'text-primary animate-pulse' : 'text-primary/70'} />
            <span className="font-mono tracking-wider">{getTimerText()}</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="md:w-[65%] p-6 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div>
              <h3 className="text-white font-display font-extrabold text-lg md:text-xl leading-tight mb-1 group-hover:text-primary transition-colors duration-200">{title}</h3>
              <p className="text-xs text-muted/70 flex items-center gap-1"><MapPin size={12} className="text-primary/70 shrink-0" /> {city}, {state}</p>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-muted/75 bg-white/5 w-fit px-2.5 py-1 rounded-lg border border-white/5 font-bold uppercase tracking-wider">
              <User size={12} className="text-primary/70" />
              <span>Seller: <strong className="text-white font-extrabold">{sellerName}</strong></span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <p className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1">Current Bid</p>
                <p className="text-2xl font-display font-black text-primary tracking-tight leading-none drop-shadow-[0_0_15px_rgba(255,215,0,0.15)]">{formatPrice(currentBid)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1">Starting Price</p>
                <p className="text-sm font-bold text-white font-display">{formatPrice(auction.startingPrice)}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-dark-border/40 pt-4 mt-1">
            <div className="flex items-center gap-1.5 text-muted/75 text-xs font-bold uppercase tracking-wider">
              <Users size={13} className="text-primary/70" />
              <span>{biddersCount} bid{biddersCount !== 1 ? 's' : ''}</span>
            </div>
            
            <div className="flex items-center gap-2.5">
              {auction.propertyId && (
                <Link
                  to={`/properties/${auction.propertyId}`}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border border-white/10 active:scale-[0.98]"
                >
                  Details
                </Link>
              )}
              <button
                onClick={() => navigate(`/auctions/${auction.auctionId}`)}
                className="px-5 py-2.5 bg-gradient-to-r from-primary to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(255,215,0,0.15)] hover:shadow-[0_0_25px_rgba(255,215,0,0.25)] active:scale-95 flex items-center gap-1.5 hover:shadow-gold"
              >
                {auction.status === 'live' ? 'Join Live' : 'View Room'} <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
