import React, { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('loan_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    // Admin credentials
    if (username === 'admin' && password === 'admin') {
      const adminUser = {
        id: 'admin',
        username: 'admin',
        role: 'admin',
        name: 'Administrator'
      };
      localStorage.setItem('loan_user', JSON.stringify(adminUser));
      setUser(adminUser);
      return { success: true };
    }

    // Check for user credentials
    const users = JSON.parse(localStorage.getItem('loan_users') || '[]');
    const foundUser = users.find(u => u.username === username && u.password === password);
    
    if (foundUser) {
      const userSession = {
        id: foundUser.id,
        username: foundUser.username,
        role: 'user',
        name: foundUser.name
      };
      localStorage.setItem('loan_user', JSON.stringify(userSession));
      setUser(userSession);
      return { success: true };
    }

    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    localStorage.removeItem('loan_user');
    setUser(null);
  };

  const value = { user, login, logout, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}