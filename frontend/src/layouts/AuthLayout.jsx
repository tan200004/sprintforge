import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-forge-gradient-dark" />
        <div className="absolute inset-0 bg-forge-radial opacity-80" />

        {/* Decorative orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-forge-600/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-forge-gradient flex items-center justify-center shadow-forge-glow">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Sprint<span className="text-forge-300">Forge</span>
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-6">
            <h1 className="text-5xl font-extrabold text-white leading-tight tracking-tight">
              Build faster.<br />
              Ship smarter.<br />
              <span className="text-forge-300">Together.</span>
            </h1>
            <p className="text-surface-400 text-lg leading-relaxed max-w-sm">
              AI-powered agile project management for engineering teams that move fast and build things that last.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {['Kanban Boards', 'AI Assistant', 'Real-time Sync', 'Sprint Analytics', 'RBAC'].map((feat) => (
                <span key={feat} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-surface-300 font-medium">
                  {feat}
                </span>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <p className="text-surface-300 text-sm italic leading-relaxed">
              "SprintForge completely transformed how our team tracks and ships work. The AI features alone save us hours every sprint."
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-8 h-8 rounded-full bg-forge-gradient flex items-center justify-center text-white text-xs font-bold">AK</div>
              <div>
                <p className="text-white text-sm font-semibold">Alex Kim</p>
                <p className="text-surface-500 text-xs">Engineering Lead @ NexaScale</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-forge-gradient flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">Sprint<span className="text-forge-400">Forge</span></span>
          </div>
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
