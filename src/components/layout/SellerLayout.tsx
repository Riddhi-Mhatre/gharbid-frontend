import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { SellerSidebar } from './SellerSidebar';
import { Bell, Menu, LogOut, PanelLeftClose, PanelLeftOpen, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useState, useEffect } from 'react';
import { NotificationPanel } from '../common/NotificationPanel';
import { useSocket } from '../../hooks/useSocket';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getNotifications } from '../../services/userService';
import { ROUTES } from '../../utils/constants';
import { SearchBar } from '../common/SearchBar';
import { useChatStore } from '../../store/chatStore';
import { BackButton } from '../common/BackButton';

export function SellerLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const socket = useSocket();
  const queryClient = useQueryClient();
  const location = useLocation();
  const isChatPage = location.pathname.includes('/chat');

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });
  const hasUnread = notifications.some((n: any) => !n.isRead);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notif: any) => {
      toast.info(notif.title, {
        description: notif.body,
        duration: 5000,
      });
      // Invalidate queries to refresh notification panel
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    const handleChatAlert = (data: any) => {
      toast.success('New Message', { description: data.message });
      useChatStore.getState().setHasUnreadAlerts(true);
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
    };

    const handleInquiryAlert = (data: any) => {
      toast.success('New Inquiry', { description: data.message });
      useChatStore.getState().setHasUnreadAlerts(true);
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    };

    socket.on('notification', handleNotification);
    socket.on('chat_alert', handleChatAlert);
    socket.on('inquiry_alert', handleInquiryAlert);
    return () => {
      socket.off('notification', handleNotification);
      socket.off('chat_alert', handleChatAlert);
      socket.off('inquiry_alert', handleInquiryAlert);
    };
  }, [socket, queryClient]);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };

  return (
    <div className="min-h-screen bg-black flex overflow-hidden">
      <SellerSidebar 
        isOpen={isDesktopSidebarOpen} 
        mobileMenuOpen={mobileMenuOpen} 
        onMobileClose={() => setMobileMenuOpen(false)} 
      />
      
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        {/* Top Navbar */}
        <header className="h-14 md:h-20 border-b border-dark-border bg-black/50 backdrop-blur-md flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <BackButton />
            <button 
              className="p-2 -ml-2 text-white lg:hidden rounded-full hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={24} />
            </button>
            <button 
              className="hidden lg:flex p-2 -ml-2 text-white rounded-full hover:bg-white/10 text-muted hover:text-white transition-colors"
              onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
              title={isDesktopSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {isDesktopSidebarOpen ? <PanelLeftClose size={24} /> : <PanelLeftOpen size={24} />}
            </button>
            <SearchBar role="seller" />
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors relative group"
              >
                <Bell size={24} className="text-white group-hover:text-primary transition-colors" />
                {hasUnread && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-black"></span>}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 top-full mt-4 w-80 md:w-96 bg-dark-card border border-dark-border shadow-2xl rounded-xl overflow-hidden z-50 animate-fade-in">
                  <NotificationPanel onClose={() => setShowNotifications(false)} />
                </div>
              )}
            </div>

            <div className="relative">
              <button 
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
              >
                <div className={`w-10 h-10 rounded-full p-[2px] shrink-0 ${user?.isVerified ? 'bg-emerald-500' : 'bg-red-500'}`}>
                  <div className="w-full h-full bg-black rounded-full flex items-center justify-center overflow-hidden">
                    {user?.profileImage ? (
                      <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className={`font-bold text-sm ${user?.isVerified ? 'text-emerald-400' : 'text-red-400'}`}>{user?.name?.charAt(0) || 'S'}</span>
                    )}
                  </div>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-bold text-white">{user?.name || 'Seller'}</p>
                  <p className={`text-xs font-medium tracking-widest uppercase ${user?.isVerified ? 'text-emerald-400' : 'text-red-400'}`}>
                    {user?.isVerified ? 'Verified' : 'Unverified'}
                  </p>
                </div>
              </button>
              
              {profileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-dark-card border border-dark-border rounded-xl shadow-xl z-50 py-1 animate-slide-up">
                  <button 
                    onClick={() => { setProfileMenuOpen(false); navigate('/seller/profile'); }} 
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-muted hover:text-white hover:bg-dark-hover transition-colors"
                  >
                    <Settings size={14} /> Profile Settings
                  </button>
                  <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-dark-hover transition-colors">
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={`flex-1 bg-black ${isChatPage ? 'flex flex-col min-h-0' : 'overflow-y-auto p-4 md:p-8 custom-scrollbar'} relative`}>
           {/* Decorative elements */}
           <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-secondary/5 blur-[120px] rounded-full pointer-events-none" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
           <div className={`relative z-10 ${isChatPage ? 'flex-1 flex flex-col min-h-0' : 'max-w-[1400px] mx-auto'}`}>
              <Outlet />
           </div>
        </main>
      </div>
    </div>
  );
}
