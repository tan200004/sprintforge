import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ArrowLeft, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg space-y-8"
      >
        {/* Glowing 404 */}
        <div className="relative">
          <div className="absolute inset-0 text-[200px] font-black text-surface-800 leading-none select-none pointer-events-none flex items-center justify-center">
            404
          </div>
          <div className="relative z-10 py-20 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shadow-forge-glow">
              <Zap className="w-10 h-10 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight glow-text">Page Not Found</h1>
              <p className="text-surface-400 text-base leading-relaxed max-w-sm mx-auto">
                This page has vanished into the backlog. It might have been deleted, moved, or never existed.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button onClick={() => window.history.back()} className="forge-btn-secondary">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <Link to="/dashboard" className="forge-btn-primary">
            <Home className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
