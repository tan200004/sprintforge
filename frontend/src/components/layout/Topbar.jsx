import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Sun, Moon, LogOut, ChevronDown, Keyboard } from 'lucide-react';
import { useForgeAuth } from '../../context/AuthContext';
import { useForgeTheme } from '../../context/ThemeContext';
import { useForgeNotifications } from '../../context/NotificationContext';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function ForgeTopbar({ onOpenCommandPalette }) {
  const { forgeUser, signOut } = useForgeAuth();
  const { activeTheme, toggleTheme } = useForgeTheme();
  const { unreadCount } = useForgeNotifications();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    navigate('/login');
  };

  return (
    <header className="h-16 bg-surface-900/80 backdrop-blur-sm border-b border-surface-800 flex items-center justify-between px-4 lg:px-6 gap-4 flex-shrink-0 z-30">
      {/* Search trigger */}
      <button
        onClick={onOpenCommandPalette}
        className="flex items-center gap-3 bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-400 hover:text-surface-200 hover:border-surface-600 transition-all duration-150 w-64 max-w-xs"
      >
        <Search className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left">Search anything...</span>
        <kbd className="hidden sm:flex items-center gap-1 text-xs text-surface-600 bg-surface-700 px-1.5 py-0.5 rounded border border-surface-600">
          <Keyboard className="w-3 h-3" /> K
        </kbd>
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="forge-btn-ghost p-2"
          title="Toggle theme"
        >
          {activeTheme === 'dark'
            ? <Sun className="w-4 h-4" />
            : <Moon className="w-4 h-4" />
          }
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((p) => !p)}
            className="forge-btn-ghost p-2 relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <NotificationDropdown onClose={() => setNotifOpen(false)} />
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((p) => !p)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-surface-800 transition-colors duration-150"
          >
            <div className="w-7 h-7 rounded-full bg-forge-gradient flex items-center justify-center text-white text-xs font-bold">
              {forgeUser?.initials || '?'}
            </div>
            <span className="hidden sm:block text-sm text-surface-200 font-medium max-w-[120px] truncate">
              {forgeUser?.fullName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-surface-400" />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-52 forge-card shadow-forge-lg z-50 py-1 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-surface-800">
                  <p className="text-sm font-semibold text-surface-100 truncate">{forgeUser?.fullName}</p>
                  <p className="text-xs text-surface-500 truncate">{forgeUser?.email}</p>
                </div>
                <button
                  onClick={() => { navigate('/profile'); setUserMenuOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-surface-300 hover:text-white hover:bg-surface-800 transition-colors"
                >
                  My Profile
                </button>
                <div className="border-t border-surface-800 mt-1 pt-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
