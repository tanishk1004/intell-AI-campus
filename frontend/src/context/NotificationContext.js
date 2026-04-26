import React, { createContext, useContext, useState } from 'react';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([
    { id: '1', title: '🎉 Welcome to IntelliCampus AI+', message: 'Your smart campus platform is ready.', type: 'info', is_read: false, created_at: new Date().toISOString() },
  ]);
  const [unreadCount, setUnreadCount] = useState(1);

  const addNotification = (notif) => {
    const n = { id: Math.random().toString(36).slice(2), ...notif, is_read: false, created_at: new Date().toISOString() };
    setNotifications(prev => [n, ...prev]);
    setUnreadCount(c => c + 1);
    toast(notif.message, {
      icon: notif.type === 'warning' ? '⚠️' : notif.type === 'success' ? '✅' : '🔔',
      duration: 4000,
    });
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
