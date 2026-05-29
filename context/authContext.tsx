import React, { createContext, useContext, useState } from 'react';
import { api, setAuthToken } from '@/services/api';

type Role = 'user' | 'admin' | 'worker';

type Account = {
  username: string;
  email: string;
  password: string;
  role: Role;
};

type User = {
  id: number;
  username: string;
  email: string;
  role: Role;
  points: number;
  phone?: string;
};

type LoginResult = {
  success: boolean;
  message: string;
  role?: Role;
};

type SignupResult = {
  success: boolean;
  message: string;
};

type AuthContextType = {
  user: User | null;
  accounts: Account[];
  login: (email: string, password: string) => Promise<LoginResult>;
  signup: (username: string, email: string, password: string) => Promise<SignupResult>;
  logout: () => void;
  refreshUserPoints: (points: number) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const [accounts] = useState<Account[]>([
    { username: 'admin1', email: 'admin@gmail.com', password: '123456', role: 'admin' },
    { username: 'worker1', email: 'worker@gmail.com', password: '123456', role: 'worker' },
    { username: 'user1', email: 'user@gmail.com', password: '123456', role: 'user' },
  ]);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const result = await api<{ token: string; user: User; message: string }>('/auth/login', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ email, password }),
      });

      setAuthToken(result.token);
      setUser(result.user);

      return {
        success: true,
        message: result.message,
        role: result.user.role,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  };

  const signup = async (
    username: string,
    email: string,
    password: string
  ): Promise<SignupResult> => {
    try {
      const result = await api<{ token: string; user: User; message: string }>('/auth/signup', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ username, email, password }),
      });

      setAuthToken(result.token);
      setUser(result.user);

      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Signup failed',
      };
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  const refreshUserPoints = (points: number) => {
    setUser((prev) => (prev ? { ...prev, points } : prev));
  };

  return (
    <AuthContext.Provider
      value={{ user, accounts, login, signup, logout, refreshUserPoints }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
