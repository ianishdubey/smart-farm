import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  email?: string;
}

export interface Farmer {
  id: string;
  full_name: string;
  phone: string | null;
  language_preference: string;
  role: 'farmer' | 'admin';
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  farmer: Farmer | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Farmer>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setUser({ id: data.id, email: data.email });
            setFarmer(data);
          } else {
            localStorage.removeItem('auth_token');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  async function signUp(email: string, password: string, fullName: string) {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName, phone: '' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Signup failed');
      }

      const data = await response.json();
      localStorage.setItem('auth_token', data.token);
      setUser({ id: data.id, email: data.email });
      setFarmer(null);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const response = await fetch(`${API_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Signin failed');
      }

      const data = await response.json();
      localStorage.setItem('auth_token', data.token);
      setUser({ id: data.id, email: data.email });
      setFarmer(data);
    } catch (error) {
      console.error('Signin error:', error);
      throw error;
    }
  }

  async function signOut() {
    try {
      localStorage.removeItem('auth_token');
      setUser(null);
      setFarmer(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async function updateProfile(data: Partial<Farmer>) {
    if (!user) throw new Error('No user logged in');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Profile update failed');

      const updated = await response.json();
      setFarmer(updated);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  const value = {
    user,
    farmer,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
