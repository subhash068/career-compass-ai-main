import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

import { authApi, AuthResponse } from '@/api/auth.api';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, name: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const justLoggedIn = useRef(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    
    if (storedToken) {
      setToken(storedToken);
      
      // First, use cached user data immediately to prevent redirect issues
      if (storedUser && storedUser !== 'undefined') {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
      
      // Then fetch fresh profile data (but not if user just logged in)
      if (!justLoggedIn.current) {
        fetchProfile();
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);


  const fetchProfile = async () => {
    try {
      const profile = await authApi.getProfile();
      // Don't overwrite if user just logged in (prevents race condition)
      if (!justLoggedIn.current) {
        setUser(profile);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      // Token invalid, clear it
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const data: AuthResponse = await authApi.login({ email, password });
      localStorage.setItem('authToken', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refreshToken', data.refresh_token);
      }
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Mark that user just logged in to prevent profile fetch from overwriting
      justLoggedIn.current = true;
      setTimeout(() => {
        justLoggedIn.current = false;
      }, 1000);
      
      setToken(data.access_token);
      setUser(data.user);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };


  const register = async (email: string, name: string, password: string): Promise<boolean> => {
    try {
      const data: AuthResponse = await authApi.register({ email, name, password });
      localStorage.setItem('authToken', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refreshToken', data.refresh_token);
      }
      setToken(data.access_token);
      setUser(data.user);
      return true;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = async () => {
    await authApi.logout();
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
