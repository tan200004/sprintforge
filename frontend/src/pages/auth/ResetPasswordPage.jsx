import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setIsSubmitting(true);
    try {
      await authService.resetPassword(token, newPassword);
      toast.success('Password reset! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Set new password</h1>
        <p className="text-surface-400 text-sm">Choose a strong password for your account.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="forge-label">New password</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Create a strong password" className="forge-input pr-10" />
            <button type="button" onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={isSubmitting} className="forge-btn-primary w-full justify-center py-3">
          {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Updating...</> : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
