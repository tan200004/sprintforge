import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useForgeAuth } from './AuthContext';

const ForgeSocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, forgeUser } = useForgeAuth();
  const socketRef = useRef(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && forgeUser) {
      const accessToken = localStorage.getItem('sf_access_token');
      if (!accessToken) return;

      socketRef.current = io('/', {
        auth: { token: accessToken },
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        transports: ['websocket'],
      });

      socketRef.current.on('connect', () => {
        setIsSocketConnected(true);
        console.log('🔌 SprintForge socket connected');
      });

      socketRef.current.on('disconnect', () => {
        setIsSocketConnected(false);
      });

      socketRef.current.on('connect_error', (err) => {
        console.warn('Socket connection error:', err.message);
        setIsSocketConnected(false);
      });

      return () => {
        socketRef.current?.disconnect();
        setIsSocketConnected(false);
      };
    }
  }, [isAuthenticated, forgeUser]);

  const joinProjectRoom = (projectId) => {
    socketRef.current?.emit('forge:join:project', projectId);
  };

  const leaveProjectRoom = (projectId) => {
    socketRef.current?.emit('forge:leave:project', projectId);
  };

  const onForgeEvent = (eventName, handler) => {
    socketRef.current?.on(eventName, handler);
    return () => socketRef.current?.off(eventName, handler);
  };

  return (
    <ForgeSocketContext.Provider value={{
      socket: socketRef.current,
      isSocketConnected,
      joinProjectRoom,
      leaveProjectRoom,
      onForgeEvent,
    }}>
      {children}
    </ForgeSocketContext.Provider>
  );
};

export const useForgeSocket = () => {
  const ctx = useContext(ForgeSocketContext);
  if (!ctx) throw new Error('useForgeSocket must be used within SocketProvider');
  return ctx;
};
