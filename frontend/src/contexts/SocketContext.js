import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated() && user) {
      // Connect to socket server
      const newSocket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token')
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        setConnected(true);
        
        // Join teacher-specific room for notifications
        if (user.role === 'teacher') {
          newSocket.emit('join-room', `teacher_${user._id}`);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from socket server');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      // Listen for substitution requests
      if (user.role === 'teacher') {
        newSocket.on('substitution_request', (data) => {
          toast.success(
            `New substitution request from ${data.teacherName} for ${data.subject} on ${new Date(data.date).toLocaleDateString()}`,
            { duration: 6000 }
          );
        });

        newSocket.on('substitution_accepted', (data) => {
          toast.success(
            `Your substitution request has been accepted by ${data.substituteName}`,
            { duration: 6000 }
          );
        });

        newSocket.on('leave_approved', (data) => {
          toast.success(
            `Your leave request has been approved by ${data.adminName}`,
            { duration: 6000 }
          );
        });

        newSocket.on('leave_rejected', (data) => {
          toast.error(
            `Your leave request has been rejected by ${data.adminName}. Reason: ${data.reason}`,
            { duration: 8000 }
          );
        });
      }

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user, isAuthenticated]);

  const emit = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  };

  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const value = {
    socket,
    connected,
    emit,
    on,
    off,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
