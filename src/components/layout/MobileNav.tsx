import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Gavel, MessageCircle, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useIsMobile } from '../../hooks/useMediaQuery';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Search', path: '/properties' },
  { icon: Gavel, label: 'Auctions', path: '/auctions' },
  { icon: MessageCircle, label: 'Chat', path: '/chat', auth: true },
  { icon: User, label: 'Profile', path: '/profile', auth: true },
];

export const MobileNav = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const isMobile = useIsMobile();

  if (!isMobile || location.pathname.startsWith('/buyer') || location.pathname.startsWith('/seller')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-dark-card border-t border-dark-border safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.filter(item => !item.auth || isAuthenticated).map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.auth && !isAuthenticated ? '/login' : item.path}
              id={`mobile-nav-${item.label.toLowerCase()}`}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-all ${
                active ? 'text-primary' : 'text-muted hover:text-white'
              }`}
            >
              <item.icon size={20} className={active ? 'text-primary' : ''} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {active && <div className="w-1 h-1 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
