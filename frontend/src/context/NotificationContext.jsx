import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/index';
import { useForgeSocket } from './SocketContext';
import { useForgeAuth } from './AuthContext';
import toast from 'react-hot-toast';

const ForgeNotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useForgeAuth();
  const { onForgeEvent } = useForgeSocket();
  const [notifications, setNotifications]   = useState([]);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [notifLoading, setNotifLoading]     = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setNotifLoading(true);
    try {
      const { data } = await notificationService.list({ limit: 30 });
      setNotifications(data.data.notifications);
      setUnreadCount(data.data.unreadCount);
    } catch { /* silent */ }
    finally { setNotifLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen to live notifications
  useEffect(() => {
    const unsubscribe = onForgeEvent('forge:notification', ({ notification }) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      toast(notification.headline, {
        icon: '🔔',
        style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' },
      });
    });
    return unsubscribe;
  }, [onForgeEvent]);

  const markRead = async (id) => {
    await notificationService.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const removeNotification = async (id) => {
    await notificationService.delete(id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  return (
    <ForgeNotificationContext.Provider value={{
      notifications,
      unreadCount,
      notifLoading,
      fetchNotifications,
      markRead,
      markAllRead,
      removeNotification,
    }}>
      {children}
    </ForgeNotificationContext.Provider>
  );
};

export const useForgeNotifications = () => {
  const ctx = useContext(ForgeNotificationContext);
  if (!ctx) throw new Error('useForgeNotifications must be used within NotificationProvider');
  return ctx;
};
