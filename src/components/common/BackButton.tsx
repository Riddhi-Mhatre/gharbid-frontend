import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  className?: string;
}

export const BackButton = ({ className = '' }: BackButtonProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on main landing/dashboard routes
  const hiddenRoutes = ['/', '/buyer/dashboard', '/seller/dashboard', '/seller', '/login', '/register'];
  if (hiddenRoutes.includes(location.pathname)) {
    return null;
  }

  return (
    <button
      onClick={() => navigate(-1)}
      className={`group flex items-center justify-center w-10 h-10 rounded-full bg-[#0a0a0a] border border-white/10 shadow-lg hover:bg-[#1a1a1a] hover:border-primary/50 hover:shadow-[0_0_15px_rgba(255,215,0,0.15)] transition-all duration-300 shrink-0 ${className}`}
      aria-label="Go Back"
      title="Go Back"
    >
      <ArrowLeft size={18} className="text-white/60 group-hover:text-primary transition-colors group-active:-translate-x-1" />
    </button>
  );
};
