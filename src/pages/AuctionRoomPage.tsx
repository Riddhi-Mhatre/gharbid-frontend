import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getAuction, getBidHistory } from '../services/auctionService';
import { expressInterest } from '../services/propertyService';
import { toast } from 'sonner';
import { useAuctionStore } from '../store/auctionStore';
import { useAuthStore } from '../store/authStore';
import { BidPanel } from '../components/auctions/BidPanel';
import { CountdownTimer } from '../components/auctions/CountdownTimer';
import { BidHistory } from '../components/auctions/BidHistory';
import { Leaderboard } from '../components/auctions/Leaderboard';
import { ChatWindow } from '../components/chat/ChatWindow';
import { ImageGallery } from '../components/properties/ImageGallery';
import { FullPageLoader } from '../components/common/Loader';
import { ArrowLeft, Gavel, Users, MapPin, Calendar, Trophy, AlertCircle, Heart, MessageCircle, Crown, Sparkles, Clock, CheckCircle2, TrendingDown } from 'lucide-react';
import { ROUTES } from '../utils/constants';
import { formatPrice, formatDateTime } from '../utils/formatters';

export default function AuctionRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setAuction, connectToAuction, disconnectFromAuction, isConnected, bidHistory, winner } = useAuctionStore();
  const [activeTab, setActiveTab] = useState<'bids' | 'chat'>('bids');

  const { mutate: handleExpressInterest, isPending: isInterestPending } = useMutation({
    mutationFn: (propertyId: string) => expressInterest(propertyId, 'auction'),
    onSuccess: () => {
      toast.success('Interest expressed successfully! The seller has been notified.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to express interest.');
    }
  });

  // Scroll to top on mount — prevents the page from opening at the bottom
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  // ── Fetch auction (now includes embedded property snapshot) ──────────────
  const { data: auction, isLoading: auctionLoading } = useQuery({
    queryKey: ['auction', id],
    queryFn: () => getAuction(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  // ── Prefetch bid history ──────────────────────────────────────────────────
  const { data: initialBids } = useQuery({
    queryKey: ['bids', id],
    queryFn: () => getBidHistory(id!),
    enabled: !!id,
  });

  const { setBidHistory } = useAuctionStore();
  useEffect(() => {
    if (initialBids) {
      setBidHistory(initialBids);
    }
  }, [initialBids, setBidHistory]);

  // ── Extract property from embedded auction.property ───────────────────────
  // Our enriched GET /v1/auctions/:id returns { ...auction, property: { ... } }
  // We no longer need a separate getProperty call.
  const property = (auction as any)?.property ?? null;

  useEffect(() => {
    if (auction) setAuction(auction);
  }, [auction, setAuction]);

  // Connect to WebSocket auction room only when auction is loaded
  useEffect(() => {
    if (id && auction) {
      connectToAuction(id);
      return () => disconnectFromAuction(id);
    }
  }, [id, auction, connectToAuction, disconnectFromAuction]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (auctionLoading) return <FullPageLoader />;

  // ── Auction not found ─────────────────────────────────────────────────────
  if (!auction) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle size={48} className="mx-auto mb-4 text-muted opacity-30" />
          <h2 className="text-xl font-display font-bold text-white mb-2">Auction Not Found</h2>
          <p className="text-muted text-sm mb-6">
            This auction may have ended or the link may be incorrect.
          </p>
          <Link
            to={user?.role === 'seller' ? '/seller/auctions' : ROUTES.BUYER_AUCTIONS}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Back to Auctions
          </Link>
        </div>
      </div>
    );
  }

  const isLive = auction.status === 'live';
  const isScheduled = auction.status === 'scheduled';
  const isEnded = auction.status === 'completed' || auction.status === 'ended' || auction.status === 'cancelled';
  const uniqueParticipants = new Set(bidHistory.map(b => (b as any).userId ?? b.bidderId)).size;

  // Resolve property fields — use embedded snapshot first, fall back to auction-level fields
  const city        = property?.city  ?? property?.location?.city  ?? (auction as any).city  ?? 'Unknown';
  const state       = property?.state ?? property?.location?.state ?? (auction as any).state ?? '';
  const title       = property?.title ?? `Property ${auction.propertyId?.slice(0, 8)}`;
  const description = property?.description ?? '';
  const images      = property?.images ?? [];
  const area        = property?.area ?? property?.areasqft ?? null;
  const type        = property?.type ?? null;
  const bedrooms    = property?.bedrooms ?? null;

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      {/* ── Sticky Header ────────────────────────────────────────────────── */}
      <div className="bg-dark-card border-b border-dark-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={user?.role === 'seller' ? '/seller/auctions' : ROUTES.BUYER_AUCTIONS}
              className="btn-ghost p-2"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="font-display font-bold text-lg hidden sm:block truncate max-w-sm">{title}</h1>
              <div className="flex items-center gap-2">
                {isLive ? (
                  <span className="badge-live"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> LIVE NOW</span>
                ) : isScheduled ? (
                  <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">SCHEDULED</span>
                ) : (
                  <span className="text-xs text-muted bg-white/5 border border-dark-border px-2 py-0.5 rounded font-bold uppercase tracking-wider">{auction.status}</span>
                )}
                {isConnected && <span className="text-[10px] text-secondary">● Connected</span>}
              </div>
            </div>
          </div>
          {!isEnded && <CountdownTimer />}
        </div>
      </div>

      {/* ── Main Grid ────────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Property Media & Details */}
        <div className="lg:col-span-5 xl:col-span-6 space-y-6">
          <ImageGallery images={images} title={title} />

          <div className="card p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold font-display text-white">{title}</h2>
              <p className="text-xs text-muted flex items-center gap-1.5 mt-1.5">
                <MapPin size={13} /> {city}{state ? `, ${state}` : ''}
              </p>
            </div>

            {description && (
              <p className="text-muted text-sm leading-relaxed">{description}</p>
            )}

            {(area || type || bedrooms) && (
              <div className="border-t border-dark-border pt-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Property Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {area && (
                    <div>
                      <p className="text-muted text-xs uppercase mb-0.5">Area</p>
                      <p className="font-semibold text-white">{Number(area).toLocaleString()} sqft</p>
                    </div>
                  )}
                  {type && (
                    <div>
                      <p className="text-muted text-xs uppercase mb-0.5">Property Type</p>
                      <p className="font-semibold text-white capitalize">{type}</p>
                    </div>
                  )}
                  {bedrooms && bedrooms > 0 && (
                    <div>
                      <p className="text-muted text-xs uppercase mb-0.5">Bedrooms</p>
                      <p className="font-semibold text-white">{bedrooms}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-dark-border pt-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Auction Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted text-xs uppercase mb-0.5">Starting Price</p>
                  <p className="font-bold text-primary">{formatPrice(auction.startingPrice)}</p>
                </div>
                <div>
                  <p className="text-muted text-xs uppercase mb-0.5">Reserve Price</p>
                  <p className="font-semibold text-white">{formatPrice(auction.reservePrice)}</p>
                </div>
                <div>
                  <p className="text-muted text-xs uppercase mb-0.5">Bid Increment</p>
                  <p className="font-semibold text-secondary">{formatPrice(auction.bidIncrement ?? 0)}</p>
                </div>
                <div>
                  <p className="text-muted text-xs uppercase mb-0.5">Participants</p>
                  <p className="font-semibold text-white flex items-center gap-1">
                    <Users size={14} /> {uniqueParticipants}
                  </p>
                </div>
                <div>
                  <p className="text-muted text-xs uppercase mb-0.5">Start Time</p>
                  <p className="font-semibold text-white text-xs">{formatDateTime(auction.startTime)}</p>
                </div>
                <div>
                  <p className="text-muted text-xs uppercase mb-0.5">End Time</p>
                  <p className="font-semibold text-white text-xs">{formatDateTime(auction.endTime)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Bidding Panel & Activity */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          {/* Bid / Status Panel */}
          {isLive ? (
            user?.role === 'buyer' ? (
              <BidPanel auctionId={auction.auctionId} />
            ) : (
              <div className="card p-6 text-center text-muted text-sm border-dashed">
                Sellers cannot place bids.
              </div>
            )
          ) : isScheduled ? (
            <div className="card p-6 text-center space-y-4 border border-dashed border-dark-border">
              <Calendar size={36} className="mx-auto text-blue-400 opacity-60" />
              <div>
                <h3 className="font-bold text-lg text-white">Auction Scheduled</h3>
                <p className="text-muted text-xs mt-2 leading-relaxed">
                  Bidding opens once the countdown reaches zero on {formatDateTime(auction.startTime)}.
                </p>
                {user?.role === 'buyer' && property?.propertyId && (
                  <button
                    onClick={() => handleExpressInterest(property.propertyId)}
                    disabled={isInterestPending}
                    className="mt-4 flex items-center justify-center gap-2 mx-auto px-6 py-2 bg-dark-hover border border-dark-border rounded-lg hover:border-primary/50 hover:text-primary transition-all text-sm font-semibold disabled:opacity-50"
                  >
                    <Heart size={16} className={isInterestPending ? 'animate-pulse text-primary' : ''} />
                    {isInterestPending ? 'Expressing...' : 'Express Interest'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <WinnerCard
              auction={auction}
              winner={winner}
              currentUserId={user?.userId}
              userRole={user?.role}
              onGoToChat={(roomId) => {
                const base = user?.role === 'seller' ? '/seller/chat' : '/buyer/chat';
                navigate(`${base}?roomId=${roomId}`);
              }}
            />
          )}

          {/* My Bids — visible to buyers on live or completed auctions */}
          {user?.role === 'buyer' && (isLive || isEnded) && (
            <MyBidsPanel
              bidHistory={bidHistory}
              currentUserId={user.userId}
              currentHighestBidderId={(auction as any).highestBidderId}
            />
          )}

          {/* Live Activity: Bids / Chat tabs */}
          <div className="card flex flex-col" style={{ minHeight: '320px' }}>
            <div className="flex items-center justify-between mb-3 p-4 pb-0">
              <h3 className="font-semibold text-sm">Live Activity</h3>
              <div className="flex bg-dark-hover rounded p-0.5 text-xs">
                <button
                  onClick={() => setActiveTab('bids')}
                  className={`px-3 py-1 rounded-sm transition-colors ${activeTab === 'bids' ? 'bg-dark-card border border-dark-border text-white' : 'text-muted hover:text-white'}`}
                >
                  <Gavel size={12} className="inline mr-1" /> Bids
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-3 py-1 rounded-sm transition-colors ${activeTab === 'chat' ? 'bg-dark-card border border-dark-border text-white' : 'text-muted hover:text-white'}`}
                >
                  <Users size={12} className="inline mr-1" /> Chat
                </button>
              </div>
            </div>

            {/* Render both panels, hide the inactive one with CSS (no absolute positioning) */}
            <div className="flex-1 overflow-hidden">
              <div className={activeTab === 'bids' ? 'block h-full' : 'hidden'}>
                <BidHistory />
              </div>
              <div className={activeTab === 'chat' ? 'flex flex-col h-full' : 'hidden'}>
                <ChatWindow roomId={`global_auction_${auction.auctionId}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Leaderboard */}
        <div className="lg:col-span-3 hidden lg:block">
          <div className="sticky top-24">
            <Leaderboard />
          </div>
        </div>
      </div>
    </div>
  );
}
// ─── My Bids Panel ────────────────────────────────────────────────────────────

interface MyBidsPanelProps {
  bidHistory: any[];
  currentUserId: string;
  currentHighestBidderId?: string;
}

function MyBidsPanel({ bidHistory, currentUserId, currentHighestBidderId }: MyBidsPanelProps) {
  // Filter bids placed by this user, most recent first
  const myBids = bidHistory
    .filter((b) => (b.bidderId ?? b.userId) === currentUserId)
    .sort((a, b) => {
      const ta = b.timestamp ?? b.createdAt ?? 0;
      const tb = a.timestamp ?? a.createdAt ?? 0;
      return ta > tb ? 1 : ta < tb ? -1 : 0;
    });

  if (myBids.length === 0) return null;

  const isCurrentlyHighest = currentHighestBidderId === currentUserId;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border bg-dark-hover/40">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Clock size={12} className="text-primary" />
          My Bids
        </h3>
        <span className="text-xs text-muted">{myBids.length} bid{myBids.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Status summary bar */}
      <div
        className="px-4 py-2.5 flex items-center gap-2 text-xs font-bold border-b border-dark-border"
        style={
          isCurrentlyHighest
            ? { background: 'rgba(34,197,94,0.06)', color: '#22c55e' }
            : { background: 'rgba(239,68,68,0.06)', color: '#ef4444' }
        }
      >
        {isCurrentlyHighest ? (
          <>
            <CheckCircle2 size={13} />
            You are the highest bidder!
          </>
        ) : (
          <>
            <TrendingDown size={13} />
            You have been outbid — place a higher bid to stay in the lead.
          </>
        )}
      </div>

      {/* Bid rows */}
      <div className="divide-y divide-dark-border max-h-48 overflow-y-auto">
        {myBids.map((bid, idx) => {
          const isHighest = isCurrentlyHighest && idx === 0;
          const ts = bid.timestamp ?? bid.createdAt;
          const timeStr = ts
            ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : '—';

          return (
            <div
              key={bid.bidId ?? idx}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-white/3 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: isHighest ? '#22c55e' : '#6b7280' }}
                />
                <div>
                  <p className="font-display font-bold text-white text-sm leading-none">
                    {formatPrice(bid.amount)}
                  </p>
                  <p className="text-[10px] text-muted mt-0.5">{timeStr}</p>
                </div>
              </div>
              {isHighest && (
                <span
                  className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(34,197,94,0.12)',
                    color: '#22c55e',
                    border: '1px solid rgba(34,197,94,0.25)',
                  }}
                >
                  Highest
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Winner Announcement Card ────────────────────────────────────────────────


interface WinnerCardProps {
  auction: any;
  winner: {
    winnerId: string | null;
    winningBid: number | null;
    winnerName: string | null;
    winnerChatRoomId: string | null;
  };
  currentUserId?: string;
  userRole?: string;
  onGoToChat: (roomId: string) => void;
}

function WinnerCard({ auction, winner, currentUserId, userRole, onGoToChat }: WinnerCardProps) {
  // Resolve winner data: prefer live socket data, fall back to stored auction fields
  const winnerId        = winner.winnerId        ?? auction.winnerId        ?? auction.highestBidderId ?? null;
  const winningBid      = winner.winningBid      ?? auction.currentHighestBid ?? 0;
  const winnerName      = winner.winnerName      ?? auction.winnerName      ?? null;
  const winnerChatRoomId = winner.winnerChatRoomId ?? auction.winnerChatRoomId ?? null;

  const isWinner  = !!winnerId && !!currentUserId && winnerId === currentUserId;
  const isSeller  = userRole === 'seller';
  const hasBids   = winningBid > 0 && !!winnerId;

  // Display name logic: winner sees their own name, others see anonymised
  const displayName = isWinner
    ? 'You'
    : winnerName
    ? winnerName
    : winnerId
    ? `Bidder …${winnerId.slice(-6)}`
    : null;

  return (
    <div
      className="card p-6 space-y-5 border border-primary/30 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(234,179,8,0.07) 0%, rgba(0,0,0,0) 60%)',
      }}
    >
      {/* Decorative shimmer strip */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: 'linear-gradient(90deg, transparent, #EAB308, transparent)' }}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
          <Trophy size={20} className="text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted uppercase font-bold tracking-wider">Auction Closed</p>
          <h3 className="font-display font-bold text-white text-lg leading-tight">
            {hasBids ? 'We have a winner!' : 'No bids placed'}
          </h3>
        </div>
      </div>

      {hasBids ? (
        <>
          {/* Winning bid */}
          <div className="bg-black/40 rounded-xl p-4 border border-white/5 space-y-1 text-center">
            <p className="text-xs text-muted uppercase font-bold tracking-wider">Final Winning Bid</p>
            <p className="text-3xl font-display font-black text-primary">{formatPrice(winningBid)}</p>
          </div>

          {/* Winner identity */}
          <div className="flex items-center gap-3 bg-white/3 rounded-xl px-4 py-3 border border-white/5">
            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Crown size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted uppercase font-bold tracking-wider mb-0.5">Winner</p>
              <p className="font-bold text-white truncate">
                {displayName ?? 'Anonymous Bidder'}
              </p>
            </div>
            {isWinner && (
              <span
                className="shrink-0 text-xs font-black uppercase tracking-wider px-2 py-1 rounded-full border"
                style={{
                  background: 'rgba(234,179,8,0.15)',
                  borderColor: 'rgba(234,179,8,0.4)',
                  color: '#EAB308',
                }}
              >
                <Sparkles size={10} className="inline mr-1" />
                You!
              </span>
            )}
          </div>

          {/* Winner CTA — only for winner or seller */}
          {(isWinner || isSeller) && winnerChatRoomId && (
            <button
              id="auction-winner-chat-btn"
              onClick={() => onGoToChat(winnerChatRoomId)}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-100"
              style={{
                background: 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)',
                color: '#000',
                boxShadow: '0 4px 20px rgba(234,179,8,0.25)',
              }}
            >
              <MessageCircle size={16} />
              {isWinner ? '🎉 Go to Winner Chat' : 'Open Deal Chat'}
            </button>
          )}

          {/* Pending — scheduler hasn't run yet */}
          {(isWinner || isSeller) && !winnerChatRoomId && (
            <p className="text-xs text-muted text-center animate-pulse">
              Setting up your chat room… please wait a moment.
            </p>
          )}
        </>
      ) : (
        <p className="text-muted text-sm text-center">This auction ended with no bids placed.</p>
      )}
    </div>
  );
}
