import { useAuctionStore } from '../../store/auctionStore';
import { formatPrice, formatRelativeTime } from '../../utils/formatters';
import { TrendingUp } from 'lucide-react';

export const BidHistory = () => {
  const { bidHistory } = useAuctionStore();

  return (
    <div className="card p-4">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <TrendingUp size={14} className="text-primary" />
        Bid History
      </h3>
      {bidHistory.length === 0 ? (
        <p className="text-muted text-xs text-center py-4">No bids yet. Be the first!</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {bidHistory.map((bid, i) => (
            <div
              key={bid.bidId}
              className={`flex items-center justify-between p-2 rounded-lg ${
                i === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-dark-hover'
              }`}
            >
              <div>
                <p className={`text-sm font-semibold ${i === 0 ? 'text-primary' : 'text-white'}`}>
                  {formatPrice(bid.amount)}
                </p>
                <p className="text-xs text-muted">{(bid.userId ?? bid.bidderId ?? '').slice(0, 8)}…</p>
              </div>
              <p className="text-xs text-muted">{formatRelativeTime(new Date(bid.timestamp).toISOString())}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
