import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, FolderKanban, LayoutDashboard, Sparkles, Users, User, ArrowRight, X } from 'lucide-react';

const paletteCommands = [
  { id: 'dashboard',  label: 'Go to Dashboard',    icon: LayoutDashboard, path: '/dashboard',    category: 'Navigation' },
  { id: 'projects',   label: 'Go to Projects',     icon: FolderKanban,    path: '/projects',     category: 'Navigation' },
  { id: 'ai',         label: 'Open AI Assistant',  icon: Sparkles,        path: '/ai-assistant', category: 'Navigation' },
  { id: 'profile',    label: 'View My Profile',    icon: User,            path: '/profile',      category: 'Navigation' },
  { id: 'users',      label: 'Manage Users',       icon: Users,           path: '/users',        category: 'Admin' },
];

export default function CommandPalette({ onClose }) {
  const [query, setQuery]         = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const filteredCommands = paletteCommands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setActiveIndex(0); }, [query]);

  const executeCommand = (cmd) => {
    navigate(cmd.path);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && filteredCommands[activeIndex]) {
      executeCommand(filteredCommands[activeIndex]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="forge-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-lg forge-card shadow-forge-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-800">
          <Search className="w-4 h-4 text-surface-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-surface-100 placeholder-surface-500 text-sm outline-none"
          />
          <button onClick={onClose} className="text-surface-500 hover:text-surface-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="py-2 max-h-80 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-surface-500 text-sm">
              No commands found for "<span className="text-surface-300">{query}</span>"
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-100 ${
                    idx === activeIndex
                      ? 'bg-forge-600/20 text-white'
                      : 'text-surface-300 hover:bg-surface-800'
                  }`}
                >
                  <span className={`p-1.5 rounded-lg ${idx === activeIndex ? 'bg-forge-600/30' : 'bg-surface-800'}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="flex-1 text-left font-medium">{cmd.label}</span>
                  <span className="text-xs text-surface-600 bg-surface-800 px-2 py-0.5 rounded">
                    {cmd.category}
                  </span>
                  {idx === activeIndex && <ArrowRight className="w-3.5 h-3.5 text-forge-400" />}
                </button>
              );
            })
          )}
        </div>

        {/* Footer hints */}
        <div className="border-t border-surface-800 px-4 py-2 flex items-center gap-4 text-xs text-surface-600">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
