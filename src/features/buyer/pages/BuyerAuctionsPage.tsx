import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gavel, Loader2, Info } from 'lucide-react';
import { AuctionCard } from '../../../components/auctions/AuctionCard';
import { getAuctions } from '../../../services/auctionService';
import { getProperties } from '../../../services/propertyService';
import { getBuyerBids } from '../../../services/userService';
import type { AuctionWithProperty } from '../../../types/auction.types';

const TABS = ['All Active', 'Live Now', 'My Bids'] as const;
type Tab = typeof TABS[number];

export default function BuyerAuctionsPage() {
  const [tab, setTab] = useState<Tab>('All Active');

  // Fetch all auctions (scheduled, live, completed, ended)
  const { data: auctions = [], isLoading: auctionsLoading } = useQuery<AuctionWithProperty[]>({
    queryKey: ['buyer', 'all-auctions'],
    queryFn: async () => {
      const [scheduled, live, completed, ended] = await Promise.all([
        getAuctions('scheduled'),
        getAuctions('live'),
        getAuctions('completed'),
        getAuctions('ended'),
      ]);
      const list = [...(scheduled ?? []), ...(live ?? []), ...(completed ?? []), ...(ended ?? [])];
      
      // Deduplicate by auctionId just in case
      const seen = new Set();
      return list.filter(a => {
        if (!a || seen.has(a.auctionId)) return false;
        seen.add(a.auctionId);
        return true;
      });
    },
  });

  // Fetch all properties to map details
  const { data: properties = [], isLoading: propsLoading } = useQuery({
    queryKey: ['buyer', 'properties-for-auctions'],
    queryFn: () => getProperties(),
  });

  // Fetch buyer's bids to check participation
  const { data: buyerBids = [], isLoading: bidsLoading } = useQuery({
    queryKey: ['buyer', 'my-bids-for-auctions'],
    queryFn: getBuyerBids,
  });

  const isLoading = auctionsLoading || propsLoading || bidsLoading;

  // Enrich auctions in memory
  const propertyMap = new Map((properties as any[]).map(p => [p.propertyId, p]));
  const buyerBidAuctionIds = new Set((buyerBids as any[]).map(b => b.auctionId));

  const enrichedAuctions = auctions.map(auction => ({
    ...auction,
    property: propertyMap.get(auction.propertyId),
  }));

  // Filter based on tab
  const filteredAuctions = enrichedAuctions.filter(auction => {
    if (tab === 'All Active') {
      return auction.status === 'scheduled' || auction.status === 'live';
    }
    if (tab === 'Live Now') {
      return auction.status === 'live';
    }
    if (tab === 'My Bids') {
      return buyerBidAuctionIds.has(auction.auctionId);
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-dark-border pb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Gavel size={28} className="text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-black uppercase tracking-widest text-white">Auctions</h1>
          <p className="text-muted text-sm mt-1">Participate in live and scheduled property bidding events.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded font-bold uppercase tracking-widest text-xs border transition-all ${
              tab === t
                ? 'bg-primary text-black border-primary'
                : 'bg-white/5 hover:bg-white/10 text-white border-dark-border'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : filteredAuctions.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-dark-border rounded-xl bg-black/20">
          <Info size={40} className="mx-auto mb-4 text-muted opacity-30" />
          <h3 className="font-display font-bold text-white mb-2">No Auctions Found</h3>
          <p className="text-muted text-sm max-w-sm mx-auto">
            {tab === 'My Bids'
              ? "You haven't placed bids on any active auctions yet."
              : `There are no ${tab.toLowerCase()} auctions available at the moment.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAuctions.map(auction => (
            <AuctionCard key={auction.auctionId} auction={auction} />
          ))}
        </div>
      )}
    </div>
  );
}
