import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { verifySchema, type VerifyFormData } from '../utils/validators';
import { useAuth } from '../hooks/useAuth';
import { Loader } from '../components/common/Loader';
import { KeyRound, MailCheck } from 'lucide-react';
import { ROUTES } from '../utils/constants';

export default function VerifyPage() {
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const { verifyEmail } = useAuth();
  
  const initialEmail = location.state?.email || '';

  const { register, handleSubmit, formState: { errors } } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: { email: initialEmail }
  });

  // If no email in state and they land here, it's fine, they can just type it in.
  
  const onSubmit = async (data: VerifyFormData) => {
    setLoading(true);
    try { 
      await verifyEmail(data.email, data.code); 
    } catch (error: any) {
      import('sonner').then(({ toast }) => {
        const msg = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Verification failed';
        toast.error(msg);
      });
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <MailCheck size={32} />
          </div>
          <h1 className="text-3xl font-display font-bold text-gradient-gold">Verify Email</h1>
          <p className="text-muted mt-2">Enter the verification code sent to your email</p>
        </div>

        <div className="card p-8 space-y-6 shadow-xl shadow-primary/5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="verify-email" className="text-xs text-muted mb-1 block">Email</label>
              <input 
                id="verify-email" 
                type="email" 
                {...register('email')} 
                className="input-field" 
                placeholder="you@example.com" 
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
            
            <div>
              <label htmlFor="verify-code" className="text-xs text-muted mb-1 block">Verification Code</label>
              <div className="relative">
                <input 
                  id="verify-code" 
                  type="text" 
                  {...register('code')} 
                  className="input-field pl-10 tracking-widest text-lg" 
                  placeholder="000000" 
                  maxLength={6}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  <KeyRound size={18} />
                </div>
              </div>
              {errors.code && <p className="text-red-400 text-xs mt-1">{errors.code.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-6">
              {loading ? <Loader size="sm" /> : 'Verify Account'}
            </button>
          </form>

          <div className="pt-4 border-t border-dark-border text-center">
            <p className="text-sm text-muted">
              Didn't receive the code?{' '}
              <button 
                type="button" 
                className="text-primary hover:underline font-medium"
                onClick={() => {
                  import('sonner').then(({ toast }) => {
                    toast.info('Feature coming soon. For now, please check your spam folder.');
                  });
                }}
              >
                Resend Code
              </button>
            </p>
          </div>
          
          <p className="text-center text-sm text-muted">
            Back to{' '}
            <Link to={ROUTES.LOGIN} className="text-primary hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
