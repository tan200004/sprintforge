import { motion } from 'framer-motion';
import { useForgeNotifications } from '../../context/NotificationContext';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useRef } from 'react';

const eventIconMap = {
  task_assigned:              '📋',
  task_status_changed:        '🔄',
  task_commented:             '💬',
  task_due_soon:              '⏰',
  task_overdue:               '🚨',
  project_member_added:       '👥',
  project_deadline_approaching:'📅',
  mention:                    '@',
  file_uploaded:              '📎',
  sprint_started:             '🚀',
  sprint_completed:           '✅',
};

export default function NotificationDropdown({ onClose }) {
  const { notifications, unreadCount, markRead, markAllRead, removeNotification, notifLoading } = useForgeNotifications();
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-96 forge-card shadow-forge-lg z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-forge-400" />
          <span className="font-semibold text-surface-100 text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-forge-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button onClick={markAllRead} title="Mark all read"
              className="forge-btn-ghost p-1.5 text-xs flex items-center gap-1">
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onClose} className="forge-btn-ghost p-1.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-surface-800/60">
        {notifLoading ? (
          <div className="py-8 text-center text-surface-500 text-sm">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="w-8 h-8 text-surface-700 mx-auto mb-3" />
            <p className="text-surface-500 text-sm">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              className={`flex items-start gap-3 px-4 py-3 hover:bg-surface-800/50 transition-colors group ${!notif.isRead ? 'bg-forge-600/5' : ''}`}
            >
              {/* Event icon */}
              <div className="w-8 h-8 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center flex-shrink-0 text-sm">
                {eventIconMap[notif.eventType] || '🔔'}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs leading-relaxed ${notif.isRead ? 'text-surface-400' : 'text-surface-200 font-medium'}`}>
                  {notif.headline}
                </p>
                <p className="text-xs text-surface-600 mt-0.5">
                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {!notif.isRead && (
                  <button onClick={() => markRead(notif._id)}
                    className="p-1 text-surface-500 hover:text-emerald-400 transition-colors" title="Mark read">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => removeNotification(notif._id)}
                  className="p-1 text-surface-500 hover:text-rose-400 transition-colors" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Unread dot */}
              {!notif.isRead && (
                <div className="w-2 h-2 rounded-full bg-forge-500 flex-shrink-0 mt-1.5" />
              )}
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
