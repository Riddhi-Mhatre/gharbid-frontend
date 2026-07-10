import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSellerProperties, getSellerPayments, payPlatformFee } from '../../../services/sellerService';
import { Building2, CreditCard, CheckCircle, Clock, IndianRupee, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const PLATFORM_FEE = 999;

export default function PaymentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: properties = [], isLoading: propsLoading } = useQuery({
    queryKey: ['seller', 'properties'],
    queryFn: getSellerProperties,
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['seller', 'payments'],
    queryFn: getSellerPayments,
  });

  const payMutation = useMutation({
    mutationFn: payPlatformFee,
    onSuccess: () => {
      toast.success('Platform fee paid! Your property is now live.');
      queryClient.invalidateQueries({ queryKey: ['seller'] });
    },
    onError: () => toast.error('Payment failed. Please try again.'),
  });

  const unpaidProperties = (properties as any[]).filter(p => !p.platformFeePaid);
  const paidProperties = (properties as any[]).filter(p => p.platformFeePaid);

  return (
    <div className="min-h-screen text-white px-4 py-12 md:px-12">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <p className="text-muted text-xs uppercase tracking-widest mb-2">Seller</p>
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
            Platform Fees
          </h1>
          <p className="text-muted mt-2 text-sm max-w-lg">
            Pay the one-time listing fee to publish your property listing. Your listing goes live immediately after payment.
          </p>
        </div>

        {/* Fee Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="border border-dark-border bg-dark-card p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <IndianRupee size={20} className="text-secondary" />
              <span className="text-xs text-muted uppercase tracking-widest">Rental Listing</span>
            </div>
            <p className="text-4xl font-display font-black text-white">₹299</p>
            <p className="text-xs text-muted mt-2">One-time fee per rental property listing.</p>
          </div>
          <div className="border border-primary/40 bg-primary/5 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <IndianRupee size={20} className="text-primary" />
              <span className="text-xs text-muted uppercase tracking-widest">Sale Listing</span>
            </div>
            <p className="text-4xl font-display font-black text-primary">₹999</p>
            <p className="text-xs text-muted mt-2">One-time fee per sale property listing.</p>
          </div>
        </div>

        {/* Unpaid Properties */}
        {propsLoading ? (
          <div className="space-y-3 mb-8">
            {[1, 2].map(i => <div key={i} className="h-20 bg-dark-border/40 rounded animate-pulse" />)}
          </div>
        ) : unpaidProperties.length > 0 ? (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={16} className="text-yellow-400" />
              <h2 className="font-display font-bold uppercase tracking-wide text-yellow-400 text-sm">
                Pending Payment ({unpaidProperties.length})
              </h2>
            </div>
            <div className="space-y-3">
              {unpaidProperties.map((p: any) => {
                const fee = PLATFORM_FEE;
                return (
                  <div
                    key={p.propertyId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border border-yellow-500/20 bg-yellow-500/5 rounded-lg"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-dark-hover flex items-center justify-center rounded-lg flex-shrink-0">
                        <Building2 size={20} className="text-muted" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-white truncate">{p.title}</h3>
                        <p className="text-xs text-muted capitalize">For Sale · Fee: ₹{fee}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => payMutation.mutate(p.propertyId)}
                      disabled={payMutation.isPending}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 shrink-0"
                    >
                      <CreditCard size={16} />
                      Pay ₹{fee}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Paid Properties */}
        {paidProperties.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={16} className="text-emerald-400" />
              <h2 className="font-display font-bold uppercase tracking-wide text-emerald-400 text-sm">
                Fee Paid ({paidProperties.length})
              </h2>
            </div>
            <div className="space-y-3">
              {paidProperties.map((p: any) => (
                <div
                  key={p.propertyId}
                  className="flex items-center justify-between gap-4 p-5 border border-emerald-500/20 bg-emerald-500/5 rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-dark-hover flex items-center justify-center rounded-lg flex-shrink-0">
                      <Building2 size={20} className="text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white truncate">{p.title}</h3>
                      <p className="text-xs text-muted capitalize">For Sale</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full shrink-0">
                    <CheckCircle size={12} /> Paid
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className="border border-dark-border bg-dark-card p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-6">
            <Clock size={18} className="text-muted" />
            <h2 className="font-display font-bold uppercase tracking-wide">Payment History</h2>
          </div>
          {paymentsLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-12 bg-dark-border/40 rounded animate-pulse" />)}
            </div>
          ) : (payments as any[]).length === 0 ? (
            <p className="text-muted text-sm text-center py-8">No payments yet.</p>
          ) : (
            <div className="space-y-2">
              {(payments as any[]).map((pay: any) => (
                <div key={pay.paymentId} className="flex items-center justify-between p-3 border border-dark-border rounded-lg bg-black/30">
                  <div>
                    <p className="text-sm font-bold text-white capitalize">{pay.type?.replace('_', ' ')}</p>
                    <p className="text-xs text-muted">{new Date(pay.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">₹{pay.amount}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      pay.status === 'success'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }`}>
                      {pay.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/seller')}
          className="mt-8 text-muted hover:text-white text-sm transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
