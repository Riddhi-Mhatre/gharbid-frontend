import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Building2, 
  Gavel, 
  ShieldCheck, 
  LogOut, 
  MessageSquare, 
  CheckCircle,
  Sparkles,
  Settings
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useQuery } from '@tanstack/react-query';
import { getSellerInquiries } from '../../services/inquiryService';

interface SellerSidebarProps {
  isOpen: boolean;
  mobileMenuOpen?: boolean;
  onMobileClose?: () => void;
}

export function SellerSidebar({ isOpen, mobileMenuOpen, onMobileClose }: SellerSidebarProps) {
  const isExpanded = isOpen || mobileMenuOpen;
  const { logout } = useAuthStore();
  const hasUnreadAlerts = useChatStore((state) => state.hasUnreadAlerts);

  // Fetch inquiries globally to always show dot if there are pending inquiries
  const { data: inquiries = [] } = useQuery({
    queryKey: ['inquiries', 'seller'],
    queryFn: getSellerInquiries,
  });
  const pendingInquiriesCount = inquiries.filter((i: any) => i.status === 'pending').length;
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const totalUnreadMessages = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  
  const totalAlerts = pendingInquiriesCount + totalUnreadMessages;
  const showDot = hasUnreadAlerts && totalAlerts === 0;

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/seller' },
    { icon: PlusCircle, label: 'Add Property', path: '/seller/add-property' },
    { icon: Building2, label: 'My Properties', path: '/seller/my-properties' },
    { icon: CheckCircle, label: 'Sold Properties', path: '/seller/sold-properties' },
    { icon: MessageSquare, label: 'Inquiries', path: '/seller/chat' },
    { icon: Gavel, label: 'Live Auctions', path: '/seller/auctions' },
  ];

  const bottomItems = [
    { icon: Settings, label: 'Profile Settings', path: '/seller/profile' },
    { icon: ShieldCheck, label: 'Identity Verification', path: '/seller/identity-documents' },
  ];

  return (
    <aside className={`h-full bg-black/85 backdrop-blur-xl border-r border-dark-border/40 flex flex-col pt-6 relative z-50 font-sans transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'} ${mobileMenuOpen ? 'fixed inset-y-0 left-0 flex' : 'hidden lg:flex'}`}>
      {/* Brand Header */}
      <div className="px-6 mb-8 flex items-center justify-center">
        <Link to="/">
          {isExpanded ? (
            <h2 className="text-xl font-display font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent animate-fade-in">GharBid</h2>
          ) : (
            <h2 className="text-xl font-display font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent animate-fade-in">GB</h2>
          )}
        </Link>
      </div>

      {/* Nav Menu */}
      <nav className={`flex-1 overflow-y-auto overflow-x-hidden space-y-1.5 custom-scrollbar ${isExpanded ? 'px-4' : 'px-2'}`}>
        {isExpanded && (
          <p className="px-4 text-[10px] font-bold text-muted/50 uppercase tracking-widest mb-3 mt-2 whitespace-nowrap flex items-center gap-1.5">
            <Sparkles size={10} className="text-primary/70" /> Menu
          </p>
        )}
        
        {menuItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === '/seller'}
            onClick={onMobileClose}
            title={!isExpanded ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center ${isExpanded ? 'px-4 gap-4' : 'justify-center'} py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                isActive
                  ? 'text-primary bg-gradient-to-r from-primary/15 to-transparent font-semibold'
                  : 'text-muted hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={19} className={`z-10 shrink-0 transition-colors duration-300 ${isActive ? 'text-primary' : 'group-hover:text-primary'}`} />
                <span className={`z-10 whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0 overflow-hidden hidden'}`}>
                  {item.label}
                  {item.label === 'Inquiries' && totalAlerts > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-red-600 border border-red-500/20 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-md">
                      {totalAlerts}
                    </span>
                  )}
                  {item.label === 'Inquiries' && showDot && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  )}
                </span>
                
                {item.label === 'Inquiries' && !isExpanded && totalAlerts > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center border border-dark-card shadow-lg">
                    {totalAlerts}
                  </span>
                )}
                {item.label === 'Inquiries' && !isExpanded && showDot && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
                
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-yellow-600 rounded-r-full shadow-[0_0_12px_rgba(255,215,0,0.4)]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Nav */}
      <div className={`p-4 border-t border-dark-border/40 mt-auto ${!isExpanded ? 'px-2' : ''} space-y-1.5`}>
        {bottomItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            onClick={onMobileClose}
            title={!isExpanded ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center ${isExpanded ? 'gap-4 px-4' : 'justify-center'} py-3 rounded-xl transition-all duration-300 group relative ${
                isActive
                  ? 'text-primary bg-gradient-to-r from-primary/15 to-transparent font-semibold'
                  : 'text-muted hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={19} className={`shrink-0 transition-colors duration-300 ${isActive ? 'text-primary' : 'group-hover:text-primary'}`} />
                <span className={`whitespace-nowrap transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0 overflow-hidden hidden'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-yellow-600 rounded-r-full shadow-[0_0_12px_rgba(255,215,0,0.4)]" />
                )}
              </>
            )}
          </NavLink>
        ))}
        
        <button
          onClick={() => {
            logout();
            if (onMobileClose) onMobileClose();
          }}
          title={!isExpanded ? 'Logout' : undefined}
          className={`w-full flex items-center ${isExpanded ? 'gap-4 px-4' : 'justify-center'} py-3 rounded-xl text-muted hover:text-destructive hover:bg-destructive/10 transition-all duration-300 group mt-1`}
        >
          <LogOut size={19} className="shrink-0 group-hover:text-destructive transition-colors duration-300" />
          <span className={`whitespace-nowrap transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0 overflow-hidden hidden'}`}>
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}
