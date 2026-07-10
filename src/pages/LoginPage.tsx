import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  loginSchema, type LoginFormData, 
  forgotPasswordSchema, type ForgotPasswordFormData, 
  resetPasswordSchema, type ResetPasswordFormData 
} from '../utils/validators';
import { useAuth } from '../hooks/useAuth';
import { forgotPassword, resetPassword } from '../services/authService';
import { Loader } from '../components/common/Loader';
import { Eye, EyeOff, User, Building2, X, KeyRound, Sparkles, ArrowLeft } from 'lucide-react';
import { ROUTES } from '../utils/constants';

export default function LoginPage() {
  const [view, setView] = useState<'login' | 'forgot-password' | 'reset-password'>('login');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, completeChallenge } = useAuth();
  const [resetEmail, setResetEmail] = useState('');

  // Challenge state – set when Cognito returns NEW_PASSWORD_REQUIRED
  const [challenge, setChallenge] = useState<{
    session: string;
    email: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const { 
    register: registerForgot, 
    handleSubmit: handleSubmitForgot, 
    formState: { errors: errorsForgot } 
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const { 
    register: registerReset, 
    handleSubmit: handleSubmitReset, 
    formState: { errors: errorsReset } 
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const roleColorClasses = {
    buyer: 'border-white/10 hover:border-primary/30 hover:shadow-[0_0_50px_rgba(255,215,0,0.08)]',
    seller: 'border-white/10 hover:border-secondary/30 hover:shadow-[0_0_50px_rgba(0,128,128,0.1)]',
  };

  const inputCls = (r: 'buyer' | 'seller' = 'buyer') => 
    `w-full bg-black/60 border border-dark-border/80 rounded-xl px-4 py-3 text-white placeholder-muted focus:outline-none focus:ring-1 transition-all duration-300 font-sans text-base ${
      r === 'buyer' 
        ? 'focus:border-primary/60 focus:ring-primary/20 focus:shadow-[0_0_15px_rgba(255,215,0,0.05)]' 
        : 'focus:border-secondary/60 focus:ring-secondary/20 focus:shadow-[0_0_15px_rgba(0,128,128,0.05)]'
    }`;

  const labelCls = 'block text-xs font-black text-muted/70 uppercase tracking-wider mb-2 font-sans';

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const result = await login(data.email, data.password, role);
      if (result?.challenge === 'NEW_PASSWORD_REQUIRED') {
        setChallenge({ session: result.session, email: result.email });
      }
    } catch (error: any) {
      import('sonner').then(({ toast }) => {
        const msg =
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          error.message ||
          'Login failed';
        toast.error(msg);
      });
    } finally {
      setLoading(false);
    }
  };

  const onForgotSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    try {
      await forgotPassword(data.email);
      setResetEmail(data.email);
      setView('reset-password');
      import('sonner').then(({ toast }) => toast.success('Password reset code sent to your email.'));
    } catch (error: any) {
      import('sonner').then(({ toast }) => {
        const msg = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Failed to send reset code';
        toast.error(msg);
      });
    } finally {
      setLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);
    try {
      await resetPassword(data.email, data.code, data.newPassword);
      setView('login');
      import('sonner').then(({ toast }) => toast.success('Password reset successful. You can now log in.'));
    } catch (error: any) {
      import('sonner').then(({ toast }) => {
        const msg = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Failed to reset password';
        toast.error(msg);
      });
    } finally {
      setLoading(false);
    }
  };

  const onCompleteChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge) return;
    if (newPassword !== confirmPassword) {
      import('sonner').then(({ toast }) => toast.error('Passwords do not match.'));
      return;
    }
    if (newPassword.length < 8) {
      import('sonner').then(({ toast }) => toast.error('Password must be at least 8 characters.'));
      return;
    }
    setLoading(true);
    try {
      await completeChallenge(challenge.email, newPassword, challenge.session);
    } catch (error: any) {
      import('sonner').then(({ toast }) => {
        const msg =
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          error.message ||
          'Failed to set password';
        toast.error(msg);
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 bg-[#030303] overflow-hidden font-sans">
      
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 filter brightness-[0.75] scale-105 transition-transform duration-1000 pointer-events-none"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80')` }}
      />
      {/* Cinematic Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/90 to-black/40 pointer-events-none" />

      {/* Gold Ambient Glows */}
      <div className="absolute left-1/4 top-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-1/4 bottom-1/4 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Back trigger */}
      <div className="absolute top-6 right-6 z-20">
        <Link 
          to={ROUTES.HOME} 
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/60 border border-white/10 hover:bg-white/5 text-muted hover:text-white transition-all backdrop-blur-md" 
          title="Back to Home"
        >
          <X size={18} />
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {challenge ? (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-1">
                <div className="p-3.5 rounded-full bg-red-500/10 border border-red-500/30 shadow-inner">
                  <KeyRound size={26} className="text-red-400 animate-pulse" />
                </div>
              </div>
              <h1 className="text-2xl font-display font-extrabold text-white leading-tight">Set Permanent Password</h1>
              <p className="text-muted/70 text-xs leading-relaxed max-w-xs mx-auto">
                Your account requires a password change before you can continue.
              </p>
              <span className="inline-block bg-red-500/10 text-red-400 text-[10px] font-mono px-3 py-1 rounded-md border border-red-500/20">
                Email: {challenge.email}
              </span>
            </div>

            <div className="bg-[#0A0A0A]/85 backdrop-blur-xl border border-red-500/25 p-8 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)]">
              <form onSubmit={onCompleteChallenge} className="space-y-5">
                <div>
                  <label className={labelCls}>New Password</label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full bg-black/60 border border-red-500/30 rounded-xl px-4 py-3 text-white placeholder-muted focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all duration-200 text-base"
                      placeholder="Choose a strong password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Confirm Password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-black/60 border border-red-500/30 rounded-xl px-4 py-3 text-white placeholder-muted focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all duration-200 text-base"
                    placeholder="Repeat your password"
                    required
                  />
                </div>
                <button
                  id="set-password-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-xs bg-red-600 hover:bg-red-500 text-white transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                >
                  {loading ? <Loader size="sm" label="" /> : 'Set Password & Sign In'}
                </button>
              </form>
            </div>
          </div>
        ) : view === 'forgot-password' ? (
          <div className="space-y-6">
             <div className="text-center space-y-2">
              <h1 className="text-3xl font-display font-black text-white tracking-tight leading-none">Reset Password</h1>
              <p className="text-muted/80 text-sm font-bold tracking-wide">Enter your email to receive a reset code.</p>
            </div>
            <div className="bg-[#0A0A0A]/85 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)]">
              <form onSubmit={handleSubmitForgot(onForgotSubmit)} className="space-y-5">
                <div>
                  <label htmlFor="forgot-email" className={labelCls}>Email</label>
                  <input 
                    id="forgot-email" 
                    type="email" 
                    {...registerForgot('email')} 
                    className={inputCls()} 
                    placeholder="you@example.com" 
                  />
                  {errorsForgot.email && <p className="text-red-400 text-xs mt-1">{errorsForgot.email.message}</p>}
                </div>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-xs bg-white text-black hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                >
                  {loading ? <Loader size="sm" label="" /> : 'Send Reset Code'}
                </button>
                <div className="text-center mt-4">
                  <button type="button" onClick={() => setView('login')} className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors">
                    <ArrowLeft size={14} /> Back to Login
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : view === 'reset-password' ? (
           <div className="space-y-6">
             <div className="text-center space-y-2">
              <h1 className="text-3xl font-display font-black text-white tracking-tight leading-none">New Password</h1>
              <p className="text-muted/80 text-sm font-bold tracking-wide">Enter the code sent to {resetEmail}.</p>
            </div>
            <div className="bg-[#0A0A0A]/85 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)]">
              <form onSubmit={handleSubmitReset(onResetSubmit)} className="space-y-5">
                 <div>
                  <label htmlFor="reset-email" className={labelCls}>Email</label>
                  <input 
                    id="reset-email" 
                    type="email" 
                    {...registerReset('email')} 
                    defaultValue={resetEmail}
                    className={inputCls()} 
                    placeholder="you@example.com" 
                  />
                  {errorsReset.email && <p className="text-red-400 text-xs mt-1">{errorsReset.email.message}</p>}
                </div>
                <div>
                  <label htmlFor="reset-code" className={labelCls}>Verification Code</label>
                  <input 
                    id="reset-code" 
                    type="text" 
                    {...registerReset('code')} 
                    className={inputCls()} 
                    placeholder="123456" 
                  />
                  {errorsReset.code && <p className="text-red-400 text-xs mt-1">{errorsReset.code.message}</p>}
                </div>
                <div>
                  <label htmlFor="reset-new-password" className={labelCls}>New Password</label>
                  <div className="relative">
                    <input 
                      id="reset-new-password" 
                      type={showPassword ? 'text' : 'password'} 
                      {...registerReset('newPassword')} 
                      className={inputCls()} 
                      placeholder="New password" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white" 
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errorsReset.newPassword && <p className="text-red-400 text-xs mt-1">{errorsReset.newPassword.message}</p>}
                </div>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-xs bg-white text-black hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                >
                  {loading ? <Loader size="sm" label="" /> : 'Reset Password'}
                </button>
                 <div className="text-center mt-4">
                  <button type="button" onClick={() => setView('login')} className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors">
                    <ArrowLeft size={14} /> Back to Login
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">
                <Sparkles size={12} className="animate-pulse" /> GharBid Portal
              </div>
              <h1 className="text-4xl font-display font-black text-white tracking-tight leading-none">Welcome Back</h1>
              <p className="text-muted/80 text-sm font-bold tracking-wide">GharBid Premium Real Estate Portal</p>
            </div>

            <div className={`bg-[#0A0A0A]/85 backdrop-blur-xl border p-8 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] transition-all duration-500 space-y-6 ${roleColorClasses[role]}`}>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`flex-1 flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all duration-300 ${
                    role === 'buyer' 
                      ? 'bg-primary/10 border-primary text-primary shadow-[0_0_20px_rgba(255,215,0,0.15)]' 
                      : 'bg-black/60 border-dark-border/80 text-muted hover:border-primary/35 hover:text-white'
                  }`}
                >
                  <User size={18} />
                  <span className="font-black uppercase tracking-widest text-xs">Buyer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('seller')}
                  className={`flex-1 flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all duration-300 ${
                    role === 'seller' 
                      ? 'bg-secondary/10 border-secondary text-secondary shadow-[0_0_20px_rgba(0,128,128,0.2)]' 
                      : 'bg-black/60 border-dark-border/80 text-muted hover:border-secondary/35 hover:text-white'
                  }`}
                >
                  <Building2 size={18} />
                  <span className="font-black uppercase tracking-widest text-xs">Seller</span>
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className={labelCls}>Email</label>
                  <input 
                    id="login-email" 
                    type="email" 
                    {...register('email')} 
                    className={inputCls(role)} 
                    placeholder="you@example.com" 
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="login-password" className="block text-xs font-black text-muted/70 uppercase tracking-wider font-sans">Password</label>
                    <button type="button" onClick={() => setView('forgot-password')} className="text-xs text-primary hover:text-yellow-400 transition-colors">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <input 
                      id="login-password" 
                      type={showPassword ? 'text' : 'password'} 
                      {...register('password')} 
                      className={inputCls(role)} 
                      placeholder="Your password" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white" 
                      aria-label="Toggle password"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                </div>
                <button 
                  id="login-submit" 
                  type="submit" 
                  disabled={loading} 
                  className={`w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] shadow-md mt-2 ${
                    role === 'buyer'
                      ? 'bg-gradient-to-r from-primary to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black shadow-[0_0_20px_rgba(255,215,0,0.15)] hover:shadow-[0_0_30px_rgba(255,215,0,0.35)]'
                      : 'bg-gradient-to-r from-secondary to-teal-700 hover:from-teal-400 hover:to-teal-500 text-white shadow-[0_0_20px_rgba(0,128,128,0.15)] hover:shadow-[0_0_30px_rgba(0,128,128,0.35)]'
                  }`}
                >
                  {loading ? <Loader size="sm" label="" /> : 'Sign In'}
                </button>
              </form>

              <p className="text-center text-sm text-muted/80 font-bold">
                Don't have an account?{' '}
                <Link to={ROUTES.REGISTER} className="text-primary hover:text-yellow-400 hover:underline transition-colors" id="login-to-register">Register here</Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
