import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ROUTES } from '../../utils/constants';
import { Bell, LogOut, User } from 'lucide-react';
import { BackButton } from '../common/BackButton';
import { NotificationPanel } from '../common/NotificationPanel';
import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../../services/userService';
import { useState } from 'react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: isAuthenticated && !!user,
  });
  const hasUnread = notifications?.some?.((n: any) => !n.isRead);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };

  if (location.pathname.startsWith('/buyer') || location.pathname.startsWith('/seller')) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-dark-border bg-dark-card/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Back Arrow & Logo */}
          <div className="flex items-center gap-3">
            <BackButton className="md:mr-2" />
            <Link to={ROUTES.HOME} className="flex items-center gap-2 group" id="nav-logo">
              <span className="text-xl font-display font-bold text-gradient-gold group-hover:opacity-90 transition-opacity animate-brand-intro inline-block origin-left">
                GharBid
              </span>
              <span className="text-xs text-muted hidden sm:block">Trusted Real Estate</span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link to={ROUTES.PROPERTIES} className="px-4 py-2 text-sm font-medium text-white/80 rounded-lg hover:-translate-y-1 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-secondary hover:from-10% hover:to-primary hover:to-40% active:scale-95 transition-all duration-300" id="nav-properties">Properties</Link>
            <Link to="/auctions" className="px-4 py-2 text-sm font-medium text-white/80 rounded-lg hover:-translate-y-1 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-secondary hover:from-10% hover:to-primary hover:to-40% active:scale-95 transition-all duration-300" id="nav-auctions">Live Auctions</Link>
            <a href="/#faq" onClick={(e) => {
              if (location.pathname === '/') {
                e.preventDefault();
                document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
              }
            }} className="px-4 py-2 text-sm font-medium text-white/80 rounded-lg hover:-translate-y-1 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-secondary hover:from-10% hover:to-primary hover:to-40% active:scale-95 transition-all duration-300" id="nav-faq">FAQ</a>
          </div>

          {/* Auth Actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors relative group"
                    aria-label="Notifications"
                  >
                    <Bell size={18} className="text-white/80 group-hover:text-primary transition-colors" />
                    {hasUnread && <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full border-2 border-black"></span>}
                  </button>
                  
                  {showNotifications && (
                    <div className="absolute right-0 top-full mt-4 w-80 md:w-96 bg-dark-card border border-dark-border shadow-2xl rounded-xl overflow-hidden z-50 animate-fade-in">
                      <NotificationPanel onClose={() => setShowNotifications(false)} />
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    id="nav-user-menu"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 btn-ghost px-3"
                    aria-expanded={menuOpen}
                    aria-haspopup="true"
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${user.isVerified ? 'bg-emerald-500/20 border-emerald-500' : 'bg-red-500/20 border-red-500'}`}>
                      <User size={14} className={user.isVerified ? "text-emerald-400" : "text-red-400"} />
                    </div>
                    <span className="text-sm hidden sm:block">{user.name.split(' ')[0]}</span>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-12 w-48 bg-dark-card border border-dark-border rounded-xl shadow-xl z-50 py-1 animate-slide-up">
                      <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-dark-hover transition-colors" id="nav-logout">
                        <LogOut size={14} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to={ROUTES.LOGIN} className="px-4 py-2 text-sm font-medium text-white/80 rounded-lg hover:-translate-y-1 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-secondary hover:from-10% hover:to-primary hover:to-40% active:scale-95 transition-all duration-300" id="nav-login">Login</Link>
                <Link to={ROUTES.REGISTER} className="btn-primary text-sm" id="nav-register">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
