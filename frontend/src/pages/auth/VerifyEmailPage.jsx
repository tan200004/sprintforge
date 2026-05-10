import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    authService.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6">
      <div className="forge-card p-10 max-w-md w-full text-center space-y-6">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-forge-400 animate-spin mx-auto" />
            <p className="text-surface-300">Verifying your email...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Email verified!</h2>
            <p className="text-surface-400 text-sm">Your account is now active. You can sign in.</p>
            <Link to="/login" className="forge-btn-primary inline-flex mx-auto">Go to Sign In</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-14 h-14 text-rose-400 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Link expired</h2>
            <p className="text-surface-400 text-sm">This verification link is invalid or has expired. Try registering again.</p>
            <Link to="/register" className="forge-btn-secondary inline-flex mx-auto">Register Again</Link>
          </>
        )}
      </div>
    </div>
  );
}
