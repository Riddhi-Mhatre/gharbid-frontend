import { useState } from 'react';
import { X, CreditCard, CheckCircle, Loader2, Building2, ShieldCheck } from 'lucide-react';
import { createPaymentOrder, verifyPayment } from '../../services/paymentService';
import { useChatStore } from '../../store/chatStore';

// ─── Types ────────────────────────────────────────────────────────────────────
interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    // Razorpay checkout script injected via CDN in index.html
    Razorpay: new (options: object) => { open: () => void };
  }
}

interface PaymentModalProps {
  roomId: string;
  role: 'buyer' | 'seller';
  propertyTitle?: string;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Fee constants (kept in sync with backend paymentController) ──────────────
const PLATFORM_FEE = 999;
const GST_AMOUNT   = parseFloat((PLATFORM_FEE * 0.18).toFixed(2));   // 179.82
const TOTAL        = parseFloat((PLATFORM_FEE + GST_AMOUNT).toFixed(2)); // 1178.82

// ─── Component ────────────────────────────────────────────────────────────────
export const DemoPaymentModal = ({
  roomId,
  role,
  propertyTitle,
  onClose,
  onSuccess,
}: PaymentModalProps) => {
  const [step, setStep] = useState<'info' | 'processing' | 'verifying' | 'done'>('info');
  const [error, setError] = useState<string | null>(null);
  const { addMessage } = useChatStore();

  const handlePay = async () => {
    setError(null);
    setStep('processing');

    try {
      // ── 1. Create a Razorpay order on the backend ─────────────────────────
      const order = await createPaymentOrder(roomId, role);

      // ── 2. Open the Razorpay checkout widget ──────────────────────────────
      const razorpayKeyId =
        order.keyId ?? import.meta.env.VITE_RAZORPAY_KEY_ID;

      await new Promise<void>((resolve, reject) => {
        const options = {
          key:         razorpayKeyId,
          amount:      order.amount,           // in paise
          currency:    order.currency ?? 'INR',
          name:        'GharBid',
          description: `Platform Fee – ${role === 'buyer' ? 'Buyer' : 'Seller'}`,
          order_id:    order.orderId,
          prefill: {
            name:  '',
            email: '',
            contact: '',
          },
          notes: { roomId, role, propertyTitle: propertyTitle ?? '' },
          theme: { color: '#F5C518' },  // LegalNest primary
          modal: {
            ondismiss: () => reject(new Error('Payment cancelled by user')),
          },
          handler: async (response: RazorpayResponse) => {
            try {
              setStep('verifying');
              // ── 3. Verify signature on the backend ──────────────────────
              const msg = await verifyPayment({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                roomId,
                role,
              });
              addMessage(roomId, msg);
              setStep('done');
              setTimeout(() => {
                onSuccess();
                onClose();
              }, 1800);
              resolve();
            } catch (verifyErr: unknown) {
              reject(verifyErr);
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      if (msg !== 'Payment cancelled by user') {
        setError(msg);
      }
      setStep('info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-[#0d0d0d] border border-dark-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">

        {/* ── Done state ── */}
        {step === 'done' && (
          <div className="p-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mb-6 animate-pulse">
              <CheckCircle size={40} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-muted text-sm">Platform fee of ₹{PLATFORM_FEE} received. Processing deal closure...</p>
          </div>
        )}

        {/* ── Processing / verifying state ── */}
        {(step === 'processing' || step === 'verifying') && (
          <div className="p-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-6">
              <Loader2 size={40} className="text-primary animate-spin" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-2">
              {step === 'verifying' ? 'Verifying Payment…' : 'Opening Checkout…'}
            </h2>
            <p className="text-muted text-sm">
              {step === 'verifying'
                ? 'Confirming your payment with our servers…'
                : 'Please complete the payment in the Razorpay window.'}
            </p>
          </div>
        )}

        {/* ── Info / action state ── */}
        {step === 'info' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-dark-border bg-black/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <CreditCard size={18} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-white">Platform Fee</h2>
                  <p className="text-xs text-muted capitalize">{role} payment</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-dark-hover hover:bg-white/10 transition-colors"
              >
                <X size={18} className="text-muted" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Property info */}
              {propertyTitle && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-dark-card border border-dark-border">
                  <Building2 size={18} className="text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted uppercase tracking-widest font-bold mb-0.5">Property</p>
                    <p className="text-sm font-semibold text-white">{propertyTitle}</p>
                  </div>
                </div>
              )}

              {/* Fee breakdown */}
              <div className="rounded-xl border border-dark-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-dark-card">
                  <span className="text-sm text-muted">Platform Listing / Deal Fee</span>
                  <span className="text-sm font-bold text-white">₹{PLATFORM_FEE}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-dark-card border-t border-dark-border">
                  <span className="text-sm text-muted">GST (18%)</span>
                  <span className="text-sm font-bold text-white">₹{GST_AMOUNT}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-4 bg-primary/5 border-t border-primary/20">
                  <span className="text-sm font-bold text-white uppercase tracking-wide">Total</span>
                  <span className="text-xl font-display font-black text-primary">₹{TOTAL}</span>
                </div>
              </div>

              {/* Razorpay secure notice */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <ShieldCheck size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-xs text-emerald-300/80">
                  <span className="font-bold">Secured by Razorpay.</span>{' '}
                  Your payment is encrypted and processed securely. UPI, Cards, Net Banking &amp; Wallets accepted.
                </p>
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-red-400 text-center">{error}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-dark-border text-muted hover:text-white hover:border-white/30 transition-colors text-sm font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handlePay}
                className="flex-1 py-3 rounded-xl bg-primary text-black font-bold text-sm hover:bg-yellow-400 transition-all shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2"
              >
                <CreditCard size={16} />
                Pay ₹{TOTAL} via Razorpay
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
