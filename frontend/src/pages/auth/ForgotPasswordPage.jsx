import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail]           = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Please enter your email'); return; }
    setIsSubmitting(true);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-forge-600/20 border border-forge-600/30 flex items-center justify-center">
          <Mail className="w-7 h-7 text-forge-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Check your inbox</h2>
          <p className="text-surface-400 text-sm leading-relaxed">
            If <span className="text-surface-200 font-medium">{email}</span> is registered with SprintForge,
            you'll receive a password reset link within a few minutes.
          </p>
        </div>
        <Link to="/login" className="forge-btn-secondary inline-flex">
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Reset password</h1>
        <p className="text-surface-400 text-sm">Enter your email and we'll send you a reset link.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="forge-label">Email address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com" className="forge-input" autoComplete="email" />
        </div>
        <button type="submit" disabled={isSubmitting} className="forge-btn-primary w-full justify-center py-3">
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Reset Link'}
        </button>
      </form>
      <Link to="/login" className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-300 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Sign In
      </Link>
    </div>
  );
}
