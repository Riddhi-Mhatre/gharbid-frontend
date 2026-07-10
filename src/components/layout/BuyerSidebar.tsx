import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  Gavel, 
  Wallet, 
  Heart, 
  FileText, 
  Home, 
  Settings,
  LogOut,
  MessageSquare
} from 'lucide-react';
import { ROUTES } from '../../utils/constants';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

interface BuyerSidebarProps {
  isOpen: boolean;
  mobileMenuOpen?: boolean;
  onMobileClose?: () => void;
}

export function BuyerSidebar({ isOpen, mobileMenuOpen, onMobileClose }: BuyerSidebarProps) {
  const isExpanded = isOpen || mobileMenuOpen;
  const { logout } = useAuthStore();
  const hasUnreadAlerts = useChatStore((state) => state.hasUnreadAlerts);
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const totalUnreadMessages = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  const showDot = hasUnreadAlerts && totalUnreadMessages === 0;

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: ROUTES.BUYER_DASHBOARD },
    { icon: Search, label: 'Browse Properties', path: '/buyer/properties' },
    { icon: Gavel, label: 'Live Auctions', path: ROUTES.BUYER_AUCTIONS },
    { icon: MessageSquare, label: 'Messages', path: '/buyer/chat' },
    { icon: Wallet, label: 'My Bids', path: ROUTES.BUYER_BIDS },
    { icon: Heart, label: 'Saved Properties', path: ROUTES.BUYER_SAVED },
    { icon: FileText, label: 'Legal Documents', path: ROUTES.BUYER_LEGAL },
    { icon: Home, label: 'Purchased Properties', path: ROUTES.BUYER_PURCHASES },
  ];

  const bottomItems = [
    { icon: Settings, label: 'Settings', path: ROUTES.BUYER_PROFILE },
  ];

  return (
    <aside className={`h-full bg-dark-card border-r border-dark-border flex flex-col pt-6 relative z-50 font-sans transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'} ${mobileMenuOpen ? 'fixed inset-y-0 left-0 flex' : 'hidden lg:flex'}`}>
      <div className="px-6 mb-8 flex items-center justify-center">
        <Link to={ROUTES.HOME}>
          {isExpanded ? (
            <h2 className="text-xl font-display font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent animate-fade-in">GharBid</h2>
          ) : (
            <h2 className="text-xl font-display font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent animate-fade-in">GB</h2>
          )}
        </Link>
      </div>

      <nav className={`flex-1 overflow-y-auto overflow-x-hidden space-y-1 custom-scrollbar ${isExpanded ? 'px-4' : 'px-2'}`}>
        {isExpanded && <p className="px-4 text-xs font-bold text-muted uppercase tracking-widest mb-4 mt-2 whitespace-nowrap">Menu</p>}
        {menuItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            onClick={onMobileClose}
            title={!isExpanded ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center ${isExpanded ? 'px-4 gap-4' : 'justify-center'} py-3 rounded-lg transition-all duration-300 group relative overflow-hidden ${
                isActive
                  ? 'text-primary bg-primary/10 font-medium'
                  : 'text-muted hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} className={`z-10 shrink-0 transition-colors ${isActive ? 'text-primary' : 'group-hover:text-primary'}`} />
                <span className={`z-10 whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0 overflow-hidden hidden'}`}>
                  {item.label}
                  {item.label === 'Messages' && totalUnreadMessages > 0 && (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                      {totalUnreadMessages}
                    </span>
                  )}
                  {item.label === 'Messages' && showDot && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  )}
                </span>
                {item.label === 'Messages' && !isExpanded && totalUnreadMessages > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                    {totalUnreadMessages}
                  </span>
                )}
                {item.label === 'Messages' && !isExpanded && showDot && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full shadow-gold" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={`p-4 border-t border-dark-border mt-auto ${!isExpanded ? 'px-2' : ''}`}>
        {bottomItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            onClick={onMobileClose}
            title={!isExpanded ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center ${isExpanded ? 'gap-4 px-4' : 'justify-center'} py-3 rounded-lg transition-all duration-300 group ${
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted hover:text-white hover:bg-white/5'
              }`
            }
          >
            <item.icon size={20} className="shrink-0 group-hover:text-primary transition-colors" />
            <span className={`whitespace-nowrap transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0 overflow-hidden hidden'}`}>
              {item.label}
            </span>
          </NavLink>
        ))}
        <button
          onClick={() => {
            logout();
            if (onMobileClose) onMobileClose();
          }}
          title={!isExpanded ? 'Logout' : undefined}
          className={`w-full flex items-center ${isExpanded ? 'gap-4 px-4' : 'justify-center'} py-3 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 transition-all duration-300 group mt-2`}
        >
          <LogOut size={20} className="shrink-0 group-hover:text-destructive transition-colors" />
          <span className={`whitespace-nowrap transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0 overflow-hidden hidden'}`}>
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}
