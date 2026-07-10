import { useEffect } from 'react';
import { useAuctionStore } from '../../store/auctionStore';
import { formatCountdown } from '../../utils/formatters';
import { Clock } from 'lucide-react';

export const CountdownTimer = () => {
  const { timeLeft, setTimeLeft, currentAuction } = useAuctionStore();
  const isUrgent = timeLeft < 120_000 && timeLeft > 0 && currentAuction?.status === 'live';
  const isEnded = timeLeft <= 0 || currentAuction?.status === 'completed' || currentAuction?.status === 'ended' || currentAuction?.status === 'cancelled';
  const isScheduled = currentAuction?.status === 'scheduled';

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(Math.max(0, timeLeft - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  if (!currentAuction) return null;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${
        isEnded
          ? 'border-dark-border text-muted bg-white/5'
          : isUrgent
          ? 'border-red-500/50 bg-red-500/10 text-red-400 animate-pulse'
          : isScheduled
          ? 'border-blue-500/30 bg-blue-500/5 text-blue-400'
          : 'border-primary/30 bg-primary/5 text-primary'
      }`}
      role="timer"
      aria-label={`Auction countdown: ${formatCountdown(timeLeft)}`}
    >
      <Clock size={14} className={isEnded ? 'text-muted' : isScheduled ? 'text-blue-400' : 'text-primary'} />
      <span className="font-mono font-bold text-lg">{formatCountdown(timeLeft)}</span>
      {isScheduled && <span className="text-xs font-semibold uppercase tracking-wider">AUCTION STARTS IN</span>}
      {!isScheduled && !isEnded && isUrgent && <span className="text-xs font-semibold uppercase tracking-wider">ENDING SOON!</span>}
      {!isScheduled && !isEnded && !isUrgent && <span className="text-xs font-semibold uppercase tracking-wider">LIVE</span>}
      {isEnded && <span className="text-xs font-semibold uppercase tracking-wider">ENDED</span>}
    </div>
  );
};
