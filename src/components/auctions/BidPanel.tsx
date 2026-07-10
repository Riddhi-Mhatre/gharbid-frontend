import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bidSchema, type BidFormData } from '../../utils/validators';
import { formatPrice } from '../../utils/formatters';
import { useAuctionStore } from '../../store/auctionStore';
import { useAuthStore } from '../../store/authStore';
import { placeBid } from '../../services/auctionService';
import { toast } from 'sonner';

import { TrendingUp, Zap } from 'lucide-react';

interface BidPanelProps {
  auctionId: string;
}

export const BidPanel = ({ auctionId }: BidPanelProps) => {
  const { currentBid, currentAuction } = useAuctionStore();
  const { user } = useAuthStore();
  const [isAutoBid, setIsAutoBid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const increment = currentAuction?.bidIncrement ?? 10_000;
  const minBid = currentBid + increment;


  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<BidFormData>({
    resolver: zodResolver(bidSchema),
  });

  const onBid = async (data: BidFormData) => {
    if (!user) {
      return toast.error('Please log in to place a bid');
    }

    if (data.amount < minBid) {
      setError('amount', { type: 'manual', message: `Bid must be at least ${formatPrice(minBid)}` });
      return;
    }

    setSubmitting(true);
    try {
      await placeBid(auctionId, data.amount);
      toast.success(`Bid of ${formatPrice(data.amount)} placed successfully!`);
      reset();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? 'Bid failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="card-gold p-5 space-y-4 shadow-2xl" role="form" aria-label="Place a bid">
      {/* Current Bid Display */}
      <div className="text-center">
        <p className="text-muted text-xs uppercase tracking-wide mb-1">Current Highest Bid</p>
        <p className="text-3xl font-display font-black text-primary">{formatPrice(currentBid)}</p>
        <p className="text-xs text-muted mt-1">Min next bid: <span className="text-white font-bold">{formatPrice(minBid)}</span></p>
      </div>

      <form onSubmit={handleSubmit(onBid)} className="space-y-3">
        <div>
          <label htmlFor="bid-amount" className="text-xs text-muted mb-1 block font-bold uppercase tracking-wider">Your Bid (₹)</label>
          <input
            id="bid-amount"
            type="number"
            placeholder={`Min ${minBid}`}
            {...register('amount', { valueAsNumber: true })}
            className="input-field"
            aria-invalid={!!errors.amount}
          />
          {errors.amount && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.amount.message}</p>}
        </div>

        {/* Auto-bid toggle */}
        <label className="flex items-center gap-2 cursor-pointer group" htmlFor="auto-bid-toggle">
          <div className={`relative w-10 h-5 rounded-full transition-colors ${isAutoBid ? 'bg-primary' : 'bg-dark-border'}`}>
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isAutoBid ? 'translate-x-5' : ''}`} />
          </div>
          <input id="auto-bid-toggle" type="checkbox" className="sr-only" checked={isAutoBid} onChange={(e) => setIsAutoBid(e.target.checked)} />
          <span className="text-xs text-muted group-hover:text-white transition-colors">Auto-bid (place increments automatically)</span>
        </label>

        <button
          type="submit"
          id="place-bid-btn"
          disabled={submitting}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 font-bold uppercase tracking-wider py-3 rounded-lg"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <TrendingUp size={16} />
              Place Bid
            </>
          )}
        </button>
      </form>

      <p className="text-xs text-muted text-center flex items-center justify-center gap-1 leading-none font-medium">
        <Zap size={10} className="text-primary" />
        Anti-sniping: bids in last 2 min extend auction by 2 min
      </p>
    </div>
  );
};
