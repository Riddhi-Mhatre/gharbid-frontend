export type MessageType =
  | 'text'
  | 'file'
  | 'deal_request'
  | 'deal_response'
  | 'meet_proposal'
  | 'meet_confirmation'
  | 'payment_buyer'
  | 'payment_seller'
  | 'deal_closed'
  | 'auction_winner';


export type DealStatus =
  | 'requested'
  | 'accepted'
  | 'rejected'
  | 'meet_proposed'
  | 'meet_confirmed'
  | 'closed';

export interface MeetProposal {
  primaryDate: string;
  primaryTime: string;
  alt1Date: string;
  alt1Time: string;
  alt2Date: string;
  alt2Time: string;
  notes?: string;
  proposedAt: string;
}

export interface ChatRoom {
  roomId: string;
  buyerId: string;
  sellerId: string;
  transactionId: string;
  createdAt: string;
  isActive: boolean;
  propertyTitle?: string;
  buyerName?: string;
  lastMessage?: Message;
  /** 'auction' for auction-winner rooms, undefined/null for inquiry-based rooms */
  source?: 'auction' | null;
  auctionId?: string;
  // Deal state
  dealStatus?: DealStatus;
  meetProposal?: MeetProposal;
  meetConfirmedDate?: string;
  meetConfirmedTime?: string;
  buyerPaid?: boolean;
  sellerPaid?: boolean;
}

export interface Message {
  roomId: string;
  messageId: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  // System / deal message fields
  type?: MessageType;
  payload?: Record<string, any>;
}
