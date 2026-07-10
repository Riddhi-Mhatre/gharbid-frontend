import { create } from 'zustand';
import type { Bid, Auction } from '../types/auction.types';
import { initSocket } from '../utils/socket';


interface WinnerInfo {
  winnerId: string | null;
  winningBid: number | null;
  winnerName: string | null;
  winnerChatRoomId: string | null;
}

interface AuctionState {
  currentAuction: Auction | null;
  currentBid: number;
  bidHistory: Bid[];
  isConnected: boolean;
  timeLeft: number;
  // Winner state (populated when auction ends)
  winner: WinnerInfo;
  setAuction: (auction: Auction) => void;
  setBidHistory: (bids: Bid[]) => void;
  onNewBid: (bid: Bid) => void;
  setTimeLeft: (ms: number) => void;
  setWinner: (info: WinnerInfo) => void;
  connectToAuction: (auctionId: string) => void;
  disconnectFromAuction: (auctionId: string) => void;
  reset: () => void;
}

const EMPTY_WINNER: WinnerInfo = {
  winnerId: null,
  winningBid: null,
  winnerName: null,
  winnerChatRoomId: null,
};

export const useAuctionStore = create<AuctionState>((set, get) => ({
  currentAuction: null,
  currentBid: 0,
  bidHistory: [],
  isConnected: false,
  timeLeft: 0,
  winner: EMPTY_WINNER,

  setAuction: (auction) => {
    const now = Date.now();
    let timeLeft = 0;
    if (auction.status === 'scheduled') {
      timeLeft = new Date(auction.startTime).getTime() - now;
    } else if (auction.status === 'live') {
      timeLeft = new Date(auction.endTime).getTime() - now;
    }

    // Hydrate winner from stored auction data (handles page refresh after auction ends)
    const winner: WinnerInfo =
      auction.winnerId
        ? {
            winnerId: auction.winnerId,
            winningBid: auction.currentHighestBid,
            winnerName: auction.winnerName ?? null,
            winnerChatRoomId: auction.winnerChatRoomId ?? null,
          }
        : EMPTY_WINNER;

    set({ currentAuction: auction, currentBid: auction.currentHighestBid, timeLeft, winner });
  },

  setBidHistory: (bids) => set({ bidHistory: bids }),

  onNewBid: (bid) =>
    set((state) => ({
      currentBid: bid.amount,
      bidHistory: [bid, ...state.bidHistory].slice(0, 50),
    })),

  setTimeLeft: (ms) => set({ timeLeft: ms }),

  setWinner: (info) => set({ winner: info }),

  connectToAuction: (auctionId) => {
    const socket = initSocket();
    socket.emit('join_auction', { auctionId });

    socket.on('new_bid', (bid: Bid) => get().onNewBid(bid));

    socket.on('auction_extended', ({ newEndTime }: { newEndTime: number }) => {
      set({ timeLeft: newEndTime - Date.now() });
    });

    socket.on('auction_time_updated', ({ newEndTime, message }: { newEndTime: number; message?: string }) => {
      set((state) => {
        if (state.currentAuction) {
          return {
            currentAuction: { ...state.currentAuction, endTime: new Date(newEndTime).toISOString() },
            timeLeft: newEndTime - Date.now(),
          };
        }
        return { timeLeft: newEndTime - Date.now() };
      });
      if (message) {
        import('sonner').then(({ toast }) => toast.info(message));
      }
    });

    // ── Auction winner event ──────────────────────────────────────────────────
    socket.on(
      'auction_winner',
      ({
        winnerId,
        winningBid,
        winnerName,
        winnerChatRoomId,
      }: {
        winnerId: string;
        winningBid: number;
        winnerName: string | null;
        winnerChatRoomId: string | null;
      }) => {
        const winnerInfo: WinnerInfo = { winnerId, winningBid, winnerName, winnerChatRoomId };
        get().setWinner(winnerInfo);

        // Update the current auction status so the UI re-renders
        set((state) => ({
          currentAuction: state.currentAuction
            ? {
                ...state.currentAuction,
                status: 'completed',
                winnerId,
                winnerName: winnerName ?? undefined,
                winnerChatRoomId: winnerChatRoomId ?? undefined,
                highestBidderId: winnerId,
              }
            : state.currentAuction,
        }));

        // Show a toast so the winner knows immediately
        import('sonner').then(({ toast }) => {
          toast.success(`🏆 Auction ended! Winner: ${winnerName ?? 'Anonymous Bidder'}`, {
            duration: 6000,
          });
        });
      }
    );

    set({ isConnected: true });
  },

  disconnectFromAuction: (auctionId) => {
    // Use initSocket() so we never call methods on undefined
    const socket = initSocket();
    socket.emit('leave_auction', { auctionId });
    socket.off('new_bid');
    socket.off('auction_extended');
    socket.off('auction_time_updated');
    socket.off('auction_winner');
    set({ isConnected: false });
  },

  reset: () =>
    set({
      currentAuction: null,
      currentBid: 0,
      bidHistory: [],
      isConnected: false,
      winner: EMPTY_WINNER,
    }),
}));

