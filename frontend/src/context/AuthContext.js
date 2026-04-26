import React, { createContext, useContext, useState, useEffect } from 'react';
import mockApi from '../services/mockApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ic_token');
    if (token) {
      mockApi.auth.me(token)
        .then(res => setUser(res.user))
        .catch(() => localStorage.removeItem('ic_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await mockApi.auth.login(email, password);
    localStorage.setItem('ic_token', res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (data) => {
    const res = await mockApi.auth.register(data);
    localStorage.setItem('ic_token', res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('ic_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
