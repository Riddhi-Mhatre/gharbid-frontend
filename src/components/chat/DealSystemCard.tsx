import { useState } from 'react';
import {
  Handshake, CheckCircle, XCircle, Calendar, Clock,
  CreditCard, PartyPopper, Loader2, Check, AlertTriangle
} from 'lucide-react';
import { respondDeal, confirmMeet } from '../../services/chatService';
import { useChatStore } from '../../store/chatStore';
import { MeetSchedulerDialog } from './MeetSchedulerDialog';
import { DemoPaymentModal } from './DemoPaymentModal';
import type { Message, ChatRoom } from '../../types/chat.types';

interface DealSystemCardProps {
  message: Message;
  room: ChatRoom;
  isBuyer: boolean;
  isSeller: boolean;
  onRoomUpdate: (updates: Partial<ChatRoom>) => void;
}

export const DealSystemCard = ({ message, room, isBuyer, isSeller, onRoomUpdate }: DealSystemCardProps) => {
  const { addMessage } = useChatStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [showMeetScheduler, setShowMeetScheduler] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [meetChoice, setMeetChoice] = useState<'primary' | 'alt1' | 'alt2'>('primary');

  const { type, payload } = message;

  // ─── deal_request ──────────────────────────────────────────────────────────
  if (type === 'deal_request') {
    const alreadyActedOn = room.dealStatus && room.dealStatus !== 'requested';
    return (
      <div className="flex justify-center my-3">
        <div className="w-full max-w-sm bg-[#0d0d0d] border border-emerald-500/30 rounded-2xl overflow-hidden shadow-lg">
          <div className="px-5 py-4 bg-emerald-500/5 border-b border-emerald-500/20 flex items-center gap-3">
            <Handshake size={20} className="text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-white text-sm">Deal Request</p>
              <p className="text-xs text-muted">Buyer wants to close the deal on this property</p>
            </div>
          </div>
          {isSeller && !alreadyActedOn && (
            <div className="flex gap-3 p-4">
              <button
                onClick={async () => {
                  setLoading('reject');
                  try {
                    const msg = await respondDeal(room.roomId, 'reject');
                    addMessage(room.roomId, msg);
                    onRoomUpdate({ dealStatus: 'rejected' });
                  } finally { setLoading(null); }
                }}
                disabled={!!loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-bold disabled:opacity-50"
              >
                {loading === 'reject' ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                Reject
              </button>
              <button
                onClick={async () => {
                  setLoading('accept');
                  try {
                    const msg = await respondDeal(room.roomId, 'accept');
                    addMessage(room.roomId, msg);
                    onRoomUpdate({ dealStatus: 'accepted' });
                  } finally { setLoading(null); }
                }}
                disabled={!!loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 transition-colors text-sm font-bold disabled:opacity-50"
              >
                {loading === 'accept' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Accept
              </button>
            </div>
          )}
          {(isBuyer || alreadyActedOn) && (
            <div className="px-5 py-3 text-center">
              <p className="text-xs text-muted">
                {isBuyer ? 'Waiting for seller to respond...' : 'You have already responded to this request.'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── deal_response ─────────────────────────────────────────────────────────
  if (type === 'deal_response') {
    const accepted = payload?.action === 'accept';
    return (
      <div className="flex justify-center my-3">
        <div className={`w-full max-w-sm rounded-2xl overflow-hidden border ${accepted ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
          <div className="px-5 py-4 flex items-center gap-3">
            {accepted
              ? <CheckCircle size={20} className="text-emerald-400 shrink-0" />
              : <XCircle size={20} className="text-red-400 shrink-0" />}
            <div>
              <p className={`font-bold text-sm ${accepted ? 'text-emerald-400' : 'text-red-400'}`}>
                {accepted ? 'Deal Accepted!' : 'Deal Rejected'}
              </p>
              <p className="text-xs text-muted">
                {accepted
                  ? 'Seller accepted. A meeting will be scheduled shortly.'
                  : 'Seller declined the deal request. Chat is now closed.'}
              </p>
            </div>
          </div>
          {accepted && isSeller && (
            <div className="px-5 pb-4">
              <button
                onClick={() => setShowMeetScheduler(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary text-black text-sm font-bold hover:bg-teal-400 transition-all"
              >
                <Calendar size={14} /> Schedule Meeting Now
              </button>
              {showMeetScheduler && (
                <MeetSchedulerDialog roomId={room.roomId} onClose={() => setShowMeetScheduler(false)} />
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── meet_proposal ─────────────────────────────────────────────────────────
  if (type === 'meet_proposal') {
    const p = payload || {};
    const options = [
      { key: 'primary' as const, label: 'Primary Date', date: p.primaryDate, time: p.primaryTime },
      ...(p.alt1Date ? [{ key: 'alt1' as const, label: 'Alternative 1', date: p.alt1Date, time: p.alt1Time }] : []),
      ...(p.alt2Date ? [{ key: 'alt2' as const, label: 'Alternative 2', date: p.alt2Date, time: p.alt2Time }] : []),
    ];
    const alreadyConfirmed = room.dealStatus === 'meet_confirmed' || room.dealStatus === 'closed';

    return (
      <div className="flex justify-center my-3">
        <div className="w-full max-w-sm bg-[#0d0d0d] border border-secondary/30 rounded-2xl overflow-hidden shadow-lg">
          <div className="px-5 py-4 bg-secondary/5 border-b border-secondary/20 flex items-center gap-3">
            <Calendar size={20} className="text-secondary shrink-0" />
            <div>
              <p className="font-bold text-white text-sm">Meeting Proposal</p>
              <p className="text-xs text-muted">Select a date to confirm the offline meeting</p>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {options.map(opt => (
              <label
                key={opt.key}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isBuyer && !alreadyConfirmed ? 'cursor-pointer' : 'cursor-default'
                } ${
                  meetChoice === opt.key
                    ? 'border-secondary/60 bg-secondary/10'
                    : 'border-dark-border hover:border-dark-border/60'
                }`}
              >
                {isBuyer && !alreadyConfirmed && (
                  <input
                    type="radio"
                    name="meet-option"
                    className="accent-teal-400"
                    checked={meetChoice === opt.key}
                    onChange={() => setMeetChoice(opt.key)}
                  />
                )}
                <div className="flex-1">
                  <p className="text-xs font-bold text-muted uppercase tracking-wider">{opt.label}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-sm font-semibold text-white flex items-center gap-1">
                      <Calendar size={11} className="text-secondary" />
                      {new Date(opt.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-sm font-semibold text-white flex items-center gap-1">
                      <Clock size={11} className="text-secondary" />
                      {opt.time}
                    </span>
                  </div>
                </div>
              </label>
            ))}
            {p.notes && (
              <p className="text-xs text-muted px-1 pt-1 italic">📝 {p.notes}</p>
            )}
          </div>
          {isBuyer && !alreadyConfirmed && (
            <div className="px-4 pb-4">
              <button
                disabled={!!loading}
                onClick={async () => {
                  setLoading('confirm');
                  const chosen = options.find(o => o.key === meetChoice)!;
                  try {
                    const msg = await confirmMeet(room.roomId, chosen.date, chosen.time);
                    addMessage(room.roomId, msg);
                    onRoomUpdate({ dealStatus: 'meet_confirmed', meetConfirmedDate: chosen.date, meetConfirmedTime: chosen.time });
                  } finally { setLoading(null); }
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary text-black text-sm font-bold hover:bg-teal-400 transition-all disabled:opacity-50"
              >
                {loading === 'confirm' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Confirm This Date
              </button>
            </div>
          )}
          {alreadyConfirmed && (
            <div className="px-5 pb-4 text-center text-xs text-muted">Meeting date confirmed ✓</div>
          )}
        </div>
      </div>
    );
  }

  // ─── meet_confirmation ─────────────────────────────────────────────────────
  if (type === 'meet_confirmation') {
    const p = payload || {};
    const buyerNeedsToPay = isBuyer && !room.buyerPaid;

    return (
      <div className="flex justify-center my-3">
        <div className="w-full max-w-sm bg-[#0d0d0d] border border-emerald-500/30 rounded-2xl overflow-hidden shadow-lg">
          <div className="px-5 py-4 bg-emerald-500/5 border-b border-emerald-500/20 flex items-center gap-3">
            <CheckCircle size={20} className="text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-white text-sm">Meeting Confirmed!</p>
              <p className="text-xs text-muted">
                {p.chosenDate && new Date(p.chosenDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} at {p.chosenTime}
              </p>
            </div>
          </div>
          {buyerNeedsToPay && (
            <div className="p-4">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 mb-3">
                <AlertTriangle size={14} className="text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-primary/90">
                  Please pay the platform fee (₹999) to finalize the deal. This is required to proceed.
                </p>
              </div>
              <button
                onClick={() => setShowPayment(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-black text-sm font-bold hover:bg-yellow-400 transition-all"
              >
                <CreditCard size={14} /> Pay Platform Fee (₹999)
              </button>
            </div>
          )}
          {showPayment && (
            <DemoPaymentModal
              roomId={room.roomId}
              role="buyer"
              propertyTitle={room.propertyTitle}
              onClose={() => setShowPayment(false)}
              onSuccess={() => onRoomUpdate({ buyerPaid: true })}
            />
          )}
        </div>
      </div>
    );
  }

  // ─── payment_buyer ─────────────────────────────────────────────────────────
  if (type === 'payment_buyer') {
    const sellerNeedsToPay = isSeller && !room.sellerPaid;
    return (
      <div className="flex justify-center my-3">
        <div className="w-full max-w-sm bg-[#0d0d0d] border border-primary/30 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-3 bg-primary/5">
            <CreditCard size={18} className="text-primary shrink-0" />
            <div>
              <p className="font-bold text-white text-sm">Buyer Paid Platform Fee ✓</p>
              <p className="text-xs text-muted">Buyer has completed their payment</p>
            </div>
          </div>
          {sellerNeedsToPay && (
            <div className="p-4">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-secondary/5 border border-secondary/20 mb-3">
                <AlertTriangle size={14} className="text-secondary mt-0.5 shrink-0" />
                <p className="text-xs text-secondary/90">
                  Buyer has paid. Please pay your platform fee (₹999) to close the deal.
                </p>
              </div>
              <button
                onClick={() => setShowPayment(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary text-black text-sm font-bold hover:bg-teal-400 transition-all"
              >
                <CreditCard size={14} /> Pay Platform Fee (₹999)
              </button>
            </div>
          )}
          {showPayment && (
            <DemoPaymentModal
              roomId={room.roomId}
              role="seller"
              propertyTitle={room.propertyTitle}
              onClose={() => setShowPayment(false)}
              onSuccess={() => onRoomUpdate({ sellerPaid: true })}
            />
          )}
        </div>
      </div>
    );
  }

  // ─── payment_seller ────────────────────────────────────────────────────────
  if (type === 'payment_seller') {
    return (
      <div className="flex justify-center my-3">
        <div className="w-full max-w-sm bg-[#0d0d0d] border border-secondary/30 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-3 bg-secondary/5">
            <CreditCard size={18} className="text-secondary shrink-0" />
            <p className="font-bold text-white text-sm">Seller Paid Platform Fee ✓</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── deal_closed ───────────────────────────────────────────────────────────
  if (type === 'deal_closed') {
    return (
      <div className="flex justify-center my-4">
        <div className="w-full max-w-sm bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/40 rounded-2xl overflow-hidden shadow-xl shadow-primary/10">
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-4">
              <PartyPopper size={30} className="text-primary" />
            </div>
            <h3 className="text-xl font-display font-black text-white mb-1">Deal Closed! 🎉</h3>
            <p className="text-sm text-muted">
              Both parties have completed payment. Your offline meeting is scheduled — congratulations!
            </p>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle size={12} /> Buyer paid
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle size={12} /> Seller paid
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── auction_winner ────────────────────────────────────────────────────────
  if (type === 'auction_winner') {
    const winningBid = payload?.winningBid;
    const propertyTitle = payload?.propertyTitle;
    return (
      <div className="flex justify-center my-4">
        <div
          className="w-full max-w-sm rounded-2xl overflow-hidden shadow-xl relative"
          style={{
            background: 'linear-gradient(135deg, #1a1400 0%, #0d0d0d 60%)',
            border: '1px solid rgba(234,179,8,0.35)',
            boxShadow: '0 8px 32px rgba(234,179,8,0.12)',
          }}
        >
          {/* Top shimmer bar */}
          <div
            className="h-0.5 w-full"
            style={{ background: 'linear-gradient(90deg, transparent, #EAB308 50%, transparent)' }}
          />
          <div className="p-6 text-center space-y-4">
            {/* Trophy */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{
                background: 'radial-gradient(circle, rgba(234,179,8,0.2) 0%, rgba(234,179,8,0.05) 70%)',
                border: '2px solid rgba(234,179,8,0.4)',
              }}
            >
              <span className="text-3xl">🏆</span>
            </div>

            <div>
              <h3
                className="text-xl font-display font-black mb-1"
                style={{ color: '#EAB308' }}
              >
                Congratulations, Winner!
              </h3>
              {propertyTitle && (
                <p className="text-xs text-muted">
                  You won the auction for <strong className="text-white">"{propertyTitle}"</strong>
                </p>
              )}
            </div>

            {winningBid && (
              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background: 'rgba(234,179,8,0.07)',
                  border: '1px solid rgba(234,179,8,0.2)',
                }}
              >
                <p className="text-xs text-muted uppercase font-bold tracking-wider mb-0.5">Winning Bid</p>
                <p
                  className="text-2xl font-display font-black"
                  style={{ color: '#EAB308' }}
                >
                  ₹{Number(winningBid).toLocaleString('en-IN')}
                </p>
              </div>
            )}

            <p className="text-xs text-muted leading-relaxed">
              Use this chat to discuss further details with the {isBuyer ? 'seller' : 'buyer'} and arrange an
              <strong className="text-white"> offline meeting</strong> at a convenient location.
            </p>
          </div>
          {/* Bottom shimmer bar */}
          <div
            className="h-0.5 w-full"
            style={{ background: 'linear-gradient(90deg, transparent, #EAB308 50%, transparent)' }}
          />
        </div>
      </div>
    );
  }

  return null;
};

