import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, Loader2, ArrowRight } from 'lucide-react';
import { useForgeAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { signIn } = useForgeAuth();
  const navigate = useNavigate();

  const [formData, setFormData]     = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors]   = useState({});

  const validateForm = () => {
    const errs = {};
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) errs.email = 'Enter a valid email';
    if (!formData.password) errs.password = 'Password is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await signIn(formData.email, formData.password);
      toast.success('Welcome back! 🚀');
      navigate('/dashboard');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Login failed. Please try again.';
      toast.error(msg);
      if (msg.toLowerCase().includes('password')) {
        setFieldErrors({ password: msg });
      } else if (msg.toLowerCase().includes('email')) {
        setFieldErrors({ email: msg });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field) => (e) => {
    setFormData((p) => ({ ...p, [field]: e.target.value }));
    if (fieldErrors[field]) setFieldErrors((p) => ({ ...p, [field]: '' }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Welcome back</h1>
        <p className="text-surface-400 text-sm">
          Sign in to your SprintForge workspace
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Email */}
        <div>
          <label className="forge-label">Email address</label>
          <input
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange('email')}
            placeholder="you@company.com"
            className={`forge-input ${fieldErrors.email ? 'border-rose-500 focus:ring-rose-500/50 focus:border-rose-500' : ''}`}
          />
          {fieldErrors.email && (
            <p className="mt-1.5 text-xs text-rose-400">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="forge-label mb-0">Password</label>
            <Link to="/forgot-password" className="text-xs text-forge-400 hover:text-forge-300 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange('password')}
              placeholder="Enter your password"
              className={`forge-input pr-10 ${fieldErrors.password ? 'border-rose-500 focus:ring-rose-500/50 focus:border-rose-500' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1.5 text-xs text-rose-400">{fieldErrors.password}</p>
          )}
        </div>

        {/* Submit */}
        <button type="submit" disabled={isSubmitting} className="forge-btn-primary w-full justify-center py-3 text-base">
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
          ) : (
            <><span>Sign In</span> <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>

      {/* Demo hint */}
      <div className="bg-forge-600/10 border border-forge-600/20 rounded-xl p-4 text-xs text-surface-400 space-y-1">
        <p className="text-forge-300 font-semibold mb-2">🔑 Demo Credentials</p>
        <p>Admin: <span className="text-surface-200">admin@sprintforge.io</span> / <span className="text-surface-200">Admin@1234</span></p>
        <p>Manager: <span className="text-surface-200">pm@sprintforge.io</span> / <span className="text-surface-200">Manager@1234</span></p>
        <p>Member: <span className="text-surface-200">dev@sprintforge.io</span> / <span className="text-surface-200">Member@1234</span></p>
      </div>

      <p className="text-center text-sm text-surface-500">
        No account yet?{' '}
        <Link to="/register" className="text-forge-400 hover:text-forge-300 font-semibold transition-colors">
          Create one free
        </Link>
      </p>
    </div>
  );
}
