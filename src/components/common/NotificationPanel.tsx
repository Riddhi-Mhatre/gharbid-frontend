import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, ShieldCheck, Gavel, Check, Trash2, Loader2, Building, Heart, MessageSquare, Handshake } from 'lucide-react';
import { getNotifications, markNotificationRead, deleteNotification } from '../../services/userService';
import { formatRelativeTime } from '../../utils/formatters';
import { toast } from 'sonner';

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  const { mutate: markAllRead, isPending: markingAll } = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter((n: any) => !n.isRead);
      await Promise.all(unread.map((n: any) => markNotificationRead(n.notificationId)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
  });

  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const { mutate: removeNotification } = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted');
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'auction':
      case 'auction_won':
      case 'outbid':
      case 'bid_placed':
      case 'bid_received':
        return Gavel;
      case 'legal':
      case 'document_verified':
        return ShieldCheck;
      case 'property_listed':
        return Building;
      case 'buyer_interest':
      case 'auction_interest':
        return Heart;
      case 'chat_notification':
        return MessageSquare;
      case 'deal_finalized':
        return Handshake;
      default:
        return Bell;
    }
  };

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'auction':
      case 'outbid':
      case 'inquiry_rejected':
        return { color: 'text-destructive', bg: 'bg-destructive/10' };
      case 'auction_won':
      case 'deal_finalized':
      case 'bid_received':
        return { color: 'text-emerald-400', bg: 'bg-emerald-400/10' };
      case 'legal':
      case 'document_verified':
        return { color: 'text-secondary', bg: 'bg-secondary/10' };
      case 'property_listed':
      case 'bid_placed':
        return { color: 'text-blue-400', bg: 'bg-blue-400/10' };
      case 'buyer_interest':
      case 'auction_interest':
        return { color: 'text-pink-400', bg: 'bg-pink-400/10' };
      case 'chat_notification':
        return { color: 'text-purple-400', bg: 'bg-purple-400/10' };
      default:
        return { color: 'text-primary', bg: 'bg-primary/10' };
    }
  };

  const handleNotifClick = (notif: any) => {
    if (!notif.isRead) {
      markRead(notif.notificationId);
    }
    onClose();
  };

  return (
    <div className="flex flex-col h-[400px]">
      <div className="p-4 border-b border-dark-border flex items-center justify-between bg-dark-card sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          <h3 className="font-bold text-white uppercase tracking-wider text-sm">Notifications</h3>
        </div>
        {notifications.some((n: any) => !n.isRead) && (
          <button 
            disabled={markingAll}
            onClick={() => markAllRead()}
            className="text-xs text-primary hover:text-white transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            {markingAll ? <Loader2 size={12} className="animate-spin" /> : <Check size={14} />} Mark all read
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted p-6 text-center">
            <Bell size={32} className="mb-4 opacity-20" />
            <p className="text-sm font-semibold">No new notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-border">
            {notifications.map((notif: any) => {
              const Icon = getIcon(notif.type);
              const classes = getColorClasses(notif.type);
              
              return (
                <div 
                  key={notif.notificationId} 
                  className={`p-4 hover:bg-white/5 transition-colors cursor-pointer flex gap-4 ${!notif.isRead ? 'bg-primary/5' : ''}`}
                  onClick={() => handleNotifClick(notif)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${classes.bg}`}>
                    <Icon size={18} className={classes.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h4 className={`text-sm font-bold truncate ${!notif.isRead ? 'text-white' : 'text-gray-300'}`}>
                        {notif.title}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0">
                        {!notif.isRead && <span className="w-2 h-2 rounded-full bg-primary"></span>}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notif.notificationId);
                          }}
                          className="p-1 hover:text-red-400 text-muted rounded transition-colors"
                          aria-label="Delete Notification"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted line-clamp-2 leading-relaxed mb-2">
                      {notif.body}
                    </p>
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-dark-border bg-black/50 text-center">
        <button onClick={onClose} className="text-xs font-bold text-muted hover:text-white transition-colors uppercase tracking-widest">
          Close Panel
        </button>
      </div>
    </div>
  );
}
