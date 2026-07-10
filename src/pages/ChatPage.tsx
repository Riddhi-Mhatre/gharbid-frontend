import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getRooms, getMessages } from '../services/chatService';
import { getSellerInquiries, acceptInquiry, rejectInquiry } from '../services/inquiryService';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { ChatWindow } from '../components/chat/ChatWindow';

import type { ChatRoom } from '../types/chat.types';
import {
  MessageSquare, Users, Clock, CheckCircle, XCircle,
  Building2, User, Inbox, ChevronRight, X, Gavel, ChevronLeft
} from 'lucide-react';
import { formatRelativeTime } from '../utils/formatters';
import { toast } from 'sonner';

type ActiveTab = 'inquiries' | 'property-chats' | 'auction-chats';

export default function ChatPage() {
  const { user } = useAuthStore();
  const { rooms, activeRoomId, setRooms, setActiveRoom, setMessages, setHasUnreadAlerts } = useChatStore();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isSeller = user?.role === 'seller';

  useEffect(() => {
    setHasUnreadAlerts(false);
  }, [setHasUnreadAlerts]);

  // Default tab: seller starts on inquiries, buyer starts on property-chats
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    isSeller ? 'inquiries' : 'property-chats'
  );

  // ─── Fetch chat rooms ──────────────────────────────────────
  const { data: fetchedRooms, isLoading: loadingRooms } = useQuery({
    queryKey: ['chat', 'rooms'],
    queryFn: getRooms,
  });

  useEffect(() => {
    if (fetchedRooms) setRooms(fetchedRooms);
  }, [fetchedRooms, setRooms]);

  // Split rooms by source
  const allRooms = rooms as ChatRoom[];
  const propertyRooms = allRooms.filter(r => r.source !== 'auction');
  const auctionRooms  = allRooms.filter(r => r.source === 'auction');

  // Open room from URL param (e.g. after auction ends, deep-link to winner chat)
  useEffect(() => {
    const roomId = searchParams.get('roomId');
    if (roomId) {
      setActiveRoom(roomId);
      // Find the room to determine the correct tab
      const targetRoom = allRooms.find(r => r.roomId === roomId);
      setActiveTab(targetRoom?.source === 'auction' ? 'auction-chats' : 'property-chats');
    }
  }, [searchParams, setActiveRoom, allRooms.length]);

  useEffect(() => {
    if (activeRoomId) {
      getMessages(activeRoomId).then(msgs => setMessages(activeRoomId, msgs));
    }
  }, [activeRoomId, setMessages]);

  // ─── Seller inquiries ──────────────────────────────────────
  const { data: inquiries = [], isLoading: loadingInquiries } = useQuery({
    queryKey: ['inquiries', 'seller'],
    queryFn: getSellerInquiries,
    enabled: isSeller,
  });

  const pendingInquiries = (inquiries as any[]).filter(i => i.status === 'pending');
  const historyInquiries = (inquiries as any[]).filter(i => i.status !== 'pending');

  const acceptMutation = useMutation({
    mutationFn: acceptInquiry,
    onSuccess: (data) => {
      toast.success('Inquiry accepted! Chat is now open.');
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'seller'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
      if (data?.room?.roomId) {
        setActiveRoom(data.room.roomId);
        setActiveTab('property-chats');
      }
    },
    onError: () => toast.error('Failed to accept inquiry.'),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectInquiry,
    onSuccess: () => {
      toast.success('Inquiry rejected.');
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'seller'] });
    },
    onError: () => toast.error('Failed to reject inquiry.'),
  });

  // ─── Status badge helper ───────────────────────────────────
  const statusBadge = (status: string) => {
    const map: Record<string, { icon: any; cls: string; label: string }> = {
      pending:  { icon: Clock,        cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', label: 'Pending' },
      accepted: { icon: CheckCircle,  cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Accepted' },
      rejected: { icon: XCircle,      cls: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'Declined' },
    };
    const cfg = map[status] ?? map.pending;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
        <Icon size={11} /> {cfg.label}
      </span>
    );
  };

  // ─── Room list panel (shared for property + auction tabs) ─
  const RoomList = ({ roomsList }: { roomsList: ChatRoom[] }) => (
    <div className={`w-full md:w-64 shrink-0 min-h-0 bg-dark-card border border-dark-border rounded-2xl flex-col overflow-hidden ${activeRoomId ? 'hidden md:flex' : 'flex'}`}>
      <div className="p-4 border-b border-dark-border">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted">Conversations</h3>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loadingRooms ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-dark-border/40 rounded-xl animate-pulse" />)}
          </div>
        ) : roomsList.length === 0 ? (
          <div className="p-8 text-center text-muted">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold">No conversations yet</p>
            <p className="text-xs opacity-60 mt-1">
              {isSeller ? 'Chats will appear here.' : 'Chats will appear here once started.'}
            </p>
          </div>
        ) : (
          roomsList.map((room) => {
            const isActive = activeRoomId === room.roomId;
            const otherParty = isSeller ? room.buyerName : 'Seller';
            const label = room.propertyTitle || 'Property Chat';
            const isAuction = room.source === 'auction' || !!room.auctionId;
            return (
              <button
                key={room.roomId}
                onClick={() => setActiveRoom(room.roomId)}
                className={`w-full text-left p-4 border-b border-dark-border transition-colors hover:bg-dark-hover ${
                  isActive ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                    isAuction
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-dark-hover border-dark-border'
                  }`}>
                    {isAuction
                      ? <Gavel size={16} className="text-primary" />
                      : <User size={16} className="text-muted" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate">{otherParty}</p>
                    <p className="text-xs text-muted truncate">{label}</p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  // ─── Chat area panel (shared) ──────────────────────────────
  const ChatArea = () => {
    const currentRoom = allRooms.find(r => r.roomId === activeRoomId);
    const otherParty = currentRoom ? (isSeller ? currentRoom.buyerName : 'Seller') : 'Secure Conversation';

    return (
    <div className={`flex-1 min-h-0 bg-dark-card border border-dark-border rounded-2xl flex-col overflow-hidden ${!activeRoomId ? 'hidden md:flex' : 'flex'}`}>
      {activeRoomId ? (
        <>
          <div 
            className="p-3 md:p-4 border-b border-dark-border bg-black/20 backdrop-blur-sm flex items-center gap-3 cursor-pointer md:cursor-default hover:bg-white/5 transition-colors"
            onClick={() => {
              if (window.innerWidth < 768) setActiveRoom(null);
            }}
            title="Tap to go back to list"
          >
            <button className="md:hidden p-1.5 -ml-1.5 mr-1 text-muted hover:text-white rounded-lg shrink-0 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="w-9 h-9 rounded-full bg-dark-hover border border-dark-border flex items-center justify-center shrink-0">
              {currentRoom?.source === 'auction' ? <Gavel size={16} className="text-primary" /> : <User size={16} className="text-primary" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-white flex items-center gap-2 truncate">
                {otherParty}
                <span className="md:hidden text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Tap to Back</span>
              </p>
              <p className="text-xs text-muted truncate max-w-xs">{currentRoom?.propertyTitle || 'End-to-end monitored for your safety'}</p>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatWindow roomId={activeRoomId} />
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-dark-hover border border-dark-border flex items-center justify-center mb-6">
            <MessageSquare size={36} className="text-primary/40" />
          </div>
          <h3 className="text-xl font-display font-bold mb-2 text-white">Your Secure Inbox</h3>
          <p className="text-sm max-w-sm">
            Select a conversation from the left to start chatting. All messages are monitored for your safety.
          </p>
        </div>
      )}
    </div>
  )};

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-dark text-white overflow-hidden">
      {/* Top Tab Bar - Guaranteed visible */}
      <div className="shrink-0 w-full bg-dark-card border-b border-dark-border p-4 flex items-center shadow-md relative z-50">
        <div className="flex gap-2 bg-black border border-dark-border rounded-lg p-1 w-full max-w-3xl overflow-x-auto custom-scrollbar">
          {/* Inquiries tab — seller only */}
          {isSeller && (
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`flex-1 min-w-[70px] md:min-w-[120px] flex items-center justify-center gap-1 md:gap-2 px-1 md:px-4 py-1 md:py-2.5 rounded-md text-[10px] md:text-sm font-bold transition-all ${
                activeTab === 'inquiries'
                  ? 'bg-primary text-black shadow-md'
                  : 'text-muted hover:text-white hover:bg-dark-hover'
              }`}
            >
              <Inbox size={14} className="md:w-[18px] md:h-[18px]" />
              <span className="truncate">Inquiries</span>
              {pendingInquiries.length > 0 && (
                <span className="w-3.5 h-3.5 md:w-5 md:h-5 rounded-full bg-red-500 text-white text-[8px] md:text-[10px] font-black flex items-center justify-center shrink-0">
                  {pendingInquiries.length}
                </span>
              )}
            </button>
          )}

          {/* Property Chats tab */}
          <button
            onClick={() => setActiveTab('property-chats')}
            className={`flex-1 min-w-[90px] md:min-w-[140px] flex items-center justify-center gap-1 md:gap-2 px-1 md:px-4 py-1 md:py-2.5 rounded-md text-[10px] md:text-sm font-bold transition-all ${
              activeTab === 'property-chats'
                ? 'bg-primary text-black shadow-md'
                : 'text-muted hover:text-white hover:bg-dark-hover'
            }`}
          >
            <Building2 size={14} className="md:w-[18px] md:h-[18px]" />
            <span className="truncate">Property Chats</span>
            {propertyRooms.length > 0 && (
              <span className="w-3.5 h-3.5 md:w-5 md:h-5 rounded-full bg-dark-hover text-white text-[8px] md:text-[10px] font-black flex items-center justify-center shrink-0">
                {propertyRooms.length}
              </span>
            )}
          </button>

          {/* Auction Chats tab */}
          <button
            onClick={() => setActiveTab('auction-chats')}
            className={`flex-1 min-w-[90px] md:min-w-[140px] flex items-center justify-center gap-1 md:gap-2 px-1 md:px-4 py-1 md:py-2.5 rounded-md text-[10px] md:text-sm font-bold transition-all ${
              activeTab === 'auction-chats'
                ? 'bg-primary text-black shadow-md'
                : 'text-muted hover:text-white hover:bg-dark-hover'
            }`}
          >
            <Gavel size={14} className="md:w-[18px] md:h-[18px]" />
            <span className="truncate">Auction Chats</span>
            {auctionRooms.length > 0 && (
              <span className="w-3.5 h-3.5 md:w-5 md:h-5 rounded-full bg-dark-hover text-white text-[8px] md:text-[10px] font-black flex items-center justify-center shrink-0">
                {auctionRooms.length}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-black relative z-0">

        {/* ── INQUIRIES TAB (Seller only) ── */}
        {activeTab === 'inquiries' && isSeller && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-8 max-w-4xl mx-auto w-full">
            {/* Pending */}
            <div>
              <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                <Clock size={18} className="text-yellow-400" /> Pending Requests
              </h2>
              {loadingInquiries ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-24 bg-dark-card border border-dark-border rounded-xl animate-pulse" />)}
                </div>
              ) : pendingInquiries.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-dark-border rounded-2xl bg-dark-card">
                  <Inbox size={40} className="mx-auto mb-4 text-muted opacity-20" />
                  <p className="text-muted font-bold">No pending inquiries</p>
                  <p className="text-xs text-muted opacity-60 mt-1">New buyer requests will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingInquiries.map((inq: any) => (
                    <div
                      key={inq.inquiryId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-dark-card border border-dark-border rounded-2xl hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-dark-hover border border-dark-border flex items-center justify-center shrink-0">
                          <User size={20} className="text-muted" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-white">{inq.buyerName}</p>
                            {statusBadge(inq.status)}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted">
                            <Building2 size={12} className="text-primary" />
                            <span>{inq.propertyTitle}</span>
                          </div>
                          <p className="text-[11px] text-muted opacity-60 mt-0.5">
                            {new Date(inq.createdAt).toLocaleDateString()} · {formatRelativeTime(inq.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => rejectMutation.mutate(inq.inquiryId)}
                          disabled={rejectMutation.isPending}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          <X size={14} /> Decline
                        </button>
                        <button
                          onClick={() => acceptMutation.mutate(inq.inquiryId)}
                          disabled={acceptMutation.isPending}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-400 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle size={14} /> Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* History */}
            {historyInquiries.length > 0 && (
              <div>
                <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle size={18} className="text-muted" /> History
                </h2>
                <div className="space-y-3">
                  {historyInquiries.map((inq: any) => (
                    <div
                      key={inq.inquiryId}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-dark-card border rounded-2xl transition-all ${
                        inq.status === 'accepted'
                          ? 'border-emerald-500/20 hover:border-emerald-500/40 cursor-pointer'
                          : 'border-dark-border opacity-60'
                      }`}
                      onClick={() => {
                        if (inq.status === 'accepted' && inq.roomId) {
                          setActiveRoom(inq.roomId);
                          setActiveTab('property-chats');
                        }
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-dark-hover border border-dark-border flex items-center justify-center shrink-0">
                          <User size={20} className="text-muted" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-white">{inq.buyerName}</p>
                            {statusBadge(inq.status)}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted">
                            <Building2 size={12} className="text-primary" />
                            <span>{inq.propertyTitle}</span>
                          </div>
                        </div>
                      </div>
                      {inq.status === 'accepted' && (
                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold shrink-0">
                          <MessageSquare size={16} /> Open Chat <ChevronRight size={16} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PROPERTY CHATS TAB ── */}
        {activeTab === 'property-chats' && (
          <div className="flex-1 flex gap-4 min-h-0 px-2 md:px-4 py-2 md:py-4">
            <RoomList roomsList={propertyRooms} />
            <ChatArea />
          </div>
        )}

        {/* ── AUCTION CHATS TAB ── */}
        {activeTab === 'auction-chats' && (
          <div className="flex-1 flex gap-4 min-h-0 px-2 md:px-4 py-2 md:py-4">
            {/* Empty state hint when no auction rooms */}
            {auctionRooms.length === 0 && !loadingRooms ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted text-center p-8">
                <div className="w-20 h-20 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center mb-6">
                  <Gavel size={36} className="text-primary/40" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2 text-white">No Auction Chats</h3>
                <p className="text-sm max-w-sm">
                  {isSeller
                    ? 'Auction winner chats will appear here once your auctions complete.'
                    : 'Win an auction to start a private chat with the seller here.'}
                </p>
              </div>
            ) : (
              <>
                <RoomList roomsList={auctionRooms} />
                <ChatArea />
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
