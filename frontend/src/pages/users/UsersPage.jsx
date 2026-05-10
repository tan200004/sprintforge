import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Shield, ShieldCheck, ShieldAlert, MoreVertical, UserX, UserCheck } from 'lucide-react';
import { userService } from '../../services/index';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const ROLE_STYLES = { admin: 'role-admin forge-badge border', project_manager: 'role-project_manager forge-badge border', member: 'role-member forge-badge border' };
const ROLE_ICONS  = { admin: ShieldAlert, project_manager: ShieldCheck, member: Shield };

export default function UsersPage() {
  const [users, setUsers]           = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter]   = useState('');
  const [menuOpenId, setMenuOpenId]   = useState(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (roleFilter) params.role = roleFilter;
      const { data } = await userService.list(params);
      setUsers(data.data.users);
    } catch { toast.error('Failed to load users'); }
    finally { setIsLoading(false); }
  }, [searchQuery, roleFilter]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const changeRole = async (userId, newRole) => {
    try {
      await userService.changeRole(userId, newRole);
      setUsers((p) => p.map((u) => u._id === userId ? { ...u, role: newRole } : u));
      toast.success(`Role updated to ${newRole}`);
    } catch { toast.error('Failed to change role'); }
    setMenuOpenId(null);
  };

  const changeStatus = async (userId, newStatus) => {
    try {
      await userService.changeStatus(userId, newStatus);
      setUsers((p) => p.map((u) => u._id === userId ? { ...u, accountStatus: newStatus } : u));
      toast.success(`Status updated to ${newStatus}`);
    } catch { toast.error('Failed to update status'); }
    setMenuOpenId(null);
  };

  return (
    <div className="p-6 lg:p-8 max-w-screen-xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" /> User Management
          </h1>
          <p className="text-surface-400 text-sm mt-1">{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..." className="forge-input pl-9" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="forge-input max-w-xs">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="project_manager">Project Manager</option>
          <option value="member">Member</option>
        </select>
      </div>

      {/* Table */}
      <div className="forge-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-800">
                {['User', 'Role', 'Status', 'Last Active', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800/60">
              {isLoading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(5).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-800 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : users.map((user) => {
                const RoleIcon = ROLE_ICONS[user.role];
                return (
                  <motion.tr key={user._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="hover:bg-surface-800/30 transition-colors">
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {user.initials || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-surface-100">{user.fullName}</p>
                          <p className="text-xs text-surface-500">{user.email}</p>
                        </div>
                        {user.isOnline && <div className="w-2 h-2 rounded-full bg-emerald-500 ml-1" title="Online" />}
                      </div>
                    </td>
                    {/* Role */}
                    <td className="px-4 py-3">
                      <span className={clsx(ROLE_STYLES[user.role], 'text-xs flex items-center gap-1.5 w-fit')}>
                        <RoleIcon className="w-3 h-3" />
                        {user.role?.replace('_', ' ')}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={clsx('forge-badge text-xs capitalize',
                        user.accountStatus === 'active' ? 'bg-emerald-500/15 text-emerald-400' :
                        user.accountStatus === 'suspended' ? 'bg-rose-500/15 text-rose-400' :
                        'bg-amber-500/15 text-amber-400'
                      )}>
                        {user.accountStatus?.replace('_', ' ')}
                      </span>
                    </td>
                    {/* Last active */}
                    <td className="px-4 py-3 text-xs text-surface-500">
                      {user.lastActiveAt ? formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true }) : 'Never'}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button onClick={() => setMenuOpenId(menuOpenId === user._id ? null : user._id)}
                          className="forge-btn-ghost p-1.5"><MoreVertical className="w-4 h-4" /></button>
                        {menuOpenId === user._id && (
                          <motion.div initial={{ opacity: 0, scale: 0.9, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="absolute right-0 top-full mt-1 w-48 forge-card shadow-forge-lg z-20 py-1">
                            <p className="px-3 py-1.5 text-[10px] text-surface-600 uppercase font-semibold tracking-wider">Change Role</p>
                            {['admin', 'project_manager', 'member'].map((role) => (
                              <button key={role} onClick={() => changeRole(user._id, role)} disabled={user.role === role}
                                className="w-full text-left px-3 py-2 text-xs text-surface-300 hover:bg-surface-800 hover:text-white transition-colors capitalize disabled:opacity-40">
                                → {role.replace('_', ' ')}
                              </button>
                            ))}
                            <div className="border-t border-surface-800 my-1" />
                            <p className="px-3 py-1.5 text-[10px] text-surface-600 uppercase font-semibold tracking-wider">Account</p>
                            {user.accountStatus !== 'active' && (
                              <button onClick={() => changeStatus(user._id, 'active')}
                                className="w-full text-left px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-2">
                                <UserCheck className="w-3.5 h-3.5" /> Activate
                              </button>
                            )}
                            {user.accountStatus !== 'suspended' && (
                              <button onClick={() => changeStatus(user._id, 'suspended')}
                                className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-2">
                                <UserX className="w-3.5 h-3.5" /> Suspend
                              </button>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {!isLoading && users.length === 0 && (
            <div className="text-center py-12 text-surface-500 text-sm">No users found</div>
          )}
        </div>
      </div>
    </div>
  );
}
