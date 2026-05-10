import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, Users, Sparkles,
  User, ChevronLeft, ChevronRight, Zap, Settings,
} from 'lucide-react';
import { useForgeAuth } from '../../context/AuthContext';
import clsx from 'clsx';

const navItems = [
  { label: 'Dashboard',   path: '/dashboard',    icon: LayoutDashboard },
  { label: 'Projects',    path: '/projects',      icon: FolderKanban },
  { label: 'AI Assistant',path: '/ai-assistant',  icon: Sparkles },
  { label: 'Profile',     path: '/profile',       icon: User },
];

const adminNavItems = [
  { label: 'Users',       path: '/users',         icon: Users },
];

export default function ForgeSidebar({ collapsed, onToggle }) {
  const { forgeUser } = useForgeAuth();
  const location = useLocation();

  const allNavItems = [
    ...navItems,
    ...(forgeUser?.role === 'admin' ? adminNavItems : []),
  ];

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="flex flex-col bg-surface-900 border-r border-surface-800 overflow-hidden flex-shrink-0"
    >
      {/* Logo */}
      <div className={clsx(
        'flex items-center gap-3 px-4 h-16 border-b border-surface-800 flex-shrink-0',
        collapsed && 'justify-center px-2'
      )}>
        <div className="w-8 h-8 rounded-xl bg-forge-gradient flex items-center justify-center flex-shrink-0 shadow-forge-glow">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="font-bold text-white text-lg tracking-tight whitespace-nowrap overflow-hidden"
            >
              Sprint<span className="text-forge-400">Forge</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {allNavItems.map(({ label, path, icon: Icon }) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <NavLink
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-forge-600/20 text-white border border-forge-600/30'
                  : 'text-surface-400 hover:text-surface-100 hover:bg-surface-800/70',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon className={clsx('w-5 h-5 flex-shrink-0', isActive ? 'text-forge-400' : '')} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId="forge-nav-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-forge-500 rounded-full"
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User card */}
      <div className={clsx(
        'border-t border-surface-800 p-3',
        collapsed ? 'flex justify-center' : 'flex items-center gap-3'
      )}>
        <div className="w-8 h-8 rounded-full bg-forge-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {forgeUser?.initials || '?'}
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden min-w-0"
            >
              <p className="text-sm font-semibold text-surface-100 truncate">{forgeUser?.fullName}</p>
              <p className="text-xs text-surface-500 truncate capitalize">{forgeUser?.role?.replace('_', ' ')}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-10 border-t border-surface-800 text-surface-500 hover:text-surface-200 hover:bg-surface-800 transition-colors duration-150"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
}
