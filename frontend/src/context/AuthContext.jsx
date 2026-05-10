import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const ForgeAuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [forgeUser, setForgeUser]     = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const hydrateSession = useCallback(async () => {
    const storedToken = localStorage.getItem('sf_access_token');
    if (!storedToken) { setAuthLoading(false); return; }
    try {
      const { data } = await authService.getMe();
      setForgeUser(data.data.user);
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem('sf_access_token');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrateSession();
    const onExpired = () => {
      setForgeUser(null);
      setIsAuthenticated(false);
      toast.error('Session expired. Please log in again.');
    };
    window.addEventListener('forge:session:expired', onExpired);
    return () => window.removeEventListener('forge:session:expired', onExpired);
  }, [hydrateSession]);

  const signIn = async (email, password) => {
    const { data } = await authService.login({ email, password });
    const { accessToken, user } = data.data;
    localStorage.setItem('sf_access_token', accessToken);
    setForgeUser(user);
    setIsAuthenticated(true);
    return user;
  };

  const signOut = async () => {
    try { await authService.logout(); } catch { /* graceful */ }
    localStorage.removeItem('sf_access_token');
    setForgeUser(null);
    setIsAuthenticated(false);
  };

  const updateUserCache = (updatedFields) => {
    setForgeUser((prev) => ({ ...prev, ...updatedFields }));
  };

  return (
    <ForgeAuthContext.Provider value={{
      forgeUser,
      authLoading,
      isAuthenticated,
      signIn,
      signOut,
      updateUserCache,
      hydrateSession,
    }}>
      {children}
    </ForgeAuthContext.Provider>
  );
};

export const useForgeAuth = () => {
  const ctx = useContext(ForgeAuthContext);
  if (!ctx) throw new Error('useForgeAuth must be used within AuthProvider');
  return ctx;
};
