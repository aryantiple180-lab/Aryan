import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('mock_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
    setLoading(false);
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('mock_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mock_user');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('mock_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
