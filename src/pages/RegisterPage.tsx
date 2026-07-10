import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '../utils/validators';
import { useAuth } from '../hooks/useAuth';
import { Loader } from '../components/common/Loader';
import { Eye, EyeOff, User, Building2, X } from 'lucide-react';
import { ROUTES } from '../utils/constants';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register: registerUser } = useAuth();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'buyer' }
  });

  const role = watch('role');

  const roleColorClasses = {
    buyer: 'border-2 border-primary shadow-[0_0_40px_rgba(255,215,0,0.3)]',
    seller: 'border-2 border-secondary shadow-[0_0_40px_rgba(0,128,128,0.4)]',
  };

  const inputClasses = {
    buyer: 'border-primary/30 focus:border-primary focus:ring-primary shadow-[0_0_10px_rgba(255,215,0,0.1)]',
    seller: 'border-secondary/30 focus:border-secondary focus:ring-secondary shadow-[0_0_10px_rgba(0,128,128,0.1)]',
  };

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try { 
      await registerUser(data); 
    } catch (error: any) {
      import('sonner').then(({ toast }) => {
        const msg = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Registration failed';
        toast.error(msg);
      });
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="flex justify-end mb-2">
          <Link to={ROUTES.HOME} className="p-2 rounded-full hover:bg-dark-hover text-muted hover:text-white transition-colors" title="Back to Home">
            <X size={24} />
          </Link>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary from-10% to-primary to-40% drop-shadow-[0_0_10px_rgba(255,215,0,0.2)]">Join GharBid</h1>
          <p className="text-muted mt-2">Create your account to buy or sell properties securely</p>
        </div>

        <div className={`card p-8 space-y-6 transition-all duration-500 ${roleColorClasses[role as keyof typeof roleColorClasses]}`}>
          {/* Role Selection */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setValue('role', 'buyer')}
              className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 ${
                role === 'buyer' ? 'bg-primary/10 border-primary text-primary -translate-y-2 shadow-[0_0_20px_rgba(255,215,0,0.4)]' : 'bg-dark-hover border-dark-border text-muted hover:border-primary/50'
              }`}
            >
              <User size={24} />
              <span className="font-semibold text-sm">I'm a Buyer</span>
            </button>
            <button
              type="button"
              onClick={() => setValue('role', 'seller')}
              className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 ${
                role === 'seller' ? 'bg-secondary/10 border-secondary text-secondary -translate-y-2 shadow-[0_0_20px_rgba(0,128,128,0.4)]' : 'bg-dark-hover border-dark-border text-muted hover:border-secondary/50'
              }`}
            >
              <Building2 size={24} />
              <span className="font-semibold text-sm">I'm a Seller</span>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted mb-1 block">Full Name</label>
                <input type="text" {...register('name')} className={`input-field transition-all duration-300 ${inputClasses[role as keyof typeof inputClasses]}`} placeholder="John Doe" />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Phone (Optional)</label>
                <input type="tel" {...register('phone')} className={`input-field transition-all duration-300 ${inputClasses[role as keyof typeof inputClasses]}`} placeholder="+919876543210" />
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted mb-1 block">Email</label>
              <input type="email" {...register('email')} className={`input-field transition-all duration-300 ${inputClasses[role as keyof typeof inputClasses]}`} placeholder="you@example.com" />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted mb-1 block">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} {...register('password')} className={`input-field pr-10 transition-all duration-300 ${inputClasses[role as keyof typeof inputClasses]}`} placeholder="Min 8 chars" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} {...register('confirmPassword')} className={`input-field pr-10 transition-all duration-300 ${inputClasses[role as keyof typeof inputClasses]}`} placeholder="Repeat password" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary btn-shine w-full mt-6 hover:shadow-[0_0_20px_rgba(255,215,0,0.5)] hover:-translate-y-0.5 hover:brightness-110 active:scale-95 active:shadow-[0_0_10px_rgba(255,215,0,0.3)] transition-all duration-300">
              {loading ? <Loader size="sm" /> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="text-primary hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
