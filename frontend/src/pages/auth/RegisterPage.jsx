import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Check, ArrowRight } from 'lucide-react';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

const passwordRequirements = [
  { test: (p) => p.length >= 8,     label: 'At least 8 characters' },
  { test: (p) => /[A-Z]/.test(p),   label: 'One uppercase letter' },
  { test: (p) => /[0-9]/.test(p),   label: 'One number' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', role: 'member',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors]   = useState({});
  const [registered, setRegistered]     = useState(false);

  const validateForm = () => {
    const errs = {};
    if (!formData.fullName.trim() || formData.fullName.length < 2) errs.fullName = 'Full name must be at least 2 characters';
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) errs.email = 'Enter a valid email';
    if (!passwordRequirements.every((r) => r.test(formData.password))) errs.password = 'Password does not meet requirements';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await authService.register(formData);
      setRegistered(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field) => (e) => {
    setFormData((p) => ({ ...p, [field]: e.target.value }));
    if (fieldErrors[field]) setFieldErrors((p) => ({ ...p, [field]: '' }));
  };

  if (registered) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-surface-400 text-sm">
            We sent a verification link to <span className="text-surface-200 font-medium">{formData.email}</span>.
            Click it to activate your account.
          </p>
        </div>
        <Link to="/login" className="forge-btn-primary inline-flex mx-auto">
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Create your account</h1>
        <p className="text-surface-400 text-sm">Start managing projects like a pro.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Full name */}
        <div>
          <label className="forge-label">Full name</label>
          <input type="text" autoComplete="name" value={formData.fullName}
            onChange={handleChange('fullName')} placeholder="Alex Johnson"
            className={`forge-input ${fieldErrors.fullName ? 'border-rose-500' : ''}`}
          />
          {fieldErrors.fullName && <p className="mt-1.5 text-xs text-rose-400">{fieldErrors.fullName}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="forge-label">Email address</label>
          <input type="email" autoComplete="email" value={formData.email}
            onChange={handleChange('email')} placeholder="alex@company.com"
            className={`forge-input ${fieldErrors.email ? 'border-rose-500' : ''}`}
          />
          {fieldErrors.email && <p className="mt-1.5 text-xs text-rose-400">{fieldErrors.email}</p>}
        </div>

        {/* Role */}
        <div>
          <label className="forge-label">I am a...</label>
          <select value={formData.role} onChange={handleChange('role')}
            className="forge-input"
          >
            <option value="member">Team Member</option>
            <option value="project_manager">Project Manager</option>
          </select>
        </div>

        {/* Password */}
        <div>
          <label className="forge-label">Password</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} autoComplete="new-password"
              value={formData.password} onChange={handleChange('password')}
              placeholder="Create a strong password"
              className={`forge-input pr-10 ${fieldErrors.password ? 'border-rose-500' : ''}`}
            />
            <button type="button" onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {/* Password strength indicators */}
          {formData.password && (
            <div className="mt-2 space-y-1">
              {passwordRequirements.map((req) => (
                <div key={req.label} className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${req.test(formData.password) ? 'bg-emerald-500' : 'bg-surface-700'}`}>
                    {req.test(formData.password) && <Check className="w-2 h-2 text-white" />}
                  </div>
                  <span className={`text-xs ${req.test(formData.password) ? 'text-emerald-400' : 'text-surface-500'}`}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={isSubmitting} className="forge-btn-primary w-full justify-center py-3 text-base">
          {isSubmitting
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
            : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>
          }
        </button>
      </form>

      <p className="text-center text-sm text-surface-500">
        Already have an account?{' '}
        <Link to="/login" className="text-forge-400 hover:text-forge-300 font-semibold">Sign in</Link>
      </p>
    </div>
  );
}
