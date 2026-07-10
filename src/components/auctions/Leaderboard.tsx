import { useAuctionStore } from '../../store/auctionStore';
import { formatPrice } from '../../utils/formatters';
import { Trophy } from 'lucide-react';

export const Leaderboard = () => {
  const { bidHistory } = useAuctionStore();

  // Unique users sorted by highest bid
  const topBidders = Array.from(
    bidHistory.reduce((acc, bid) => {
      const uid = bid.userId ?? bid.bidderId ?? '';
      if (!acc.has(uid) || acc.get(uid)! < bid.amount) {
        acc.set(uid, bid.amount);
      }
      return acc;
    }, new Map<string, number>())
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const medals = ['🥇', '🥈', '🥉', '4', '5'];

  return (
    <div className="card p-4">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <Trophy size={14} className="text-primary" />
        Top Bidders
      </h3>
      {topBidders.length === 0 ? (
        <p className="text-muted text-xs text-center py-4">No bidders yet</p>
      ) : (
        <div className="space-y-2">
          {topBidders.map(([userId, amount], i) => (
            <div key={userId} className="flex items-center justify-between p-2 rounded-lg bg-dark-hover">
              <span className="text-sm">{medals[i]} {userId.slice(0, 8)}…</span>
              <span className={`text-sm font-semibold ${i === 0 ? 'text-primary' : 'text-white'}`}>
                {formatPrice(amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
