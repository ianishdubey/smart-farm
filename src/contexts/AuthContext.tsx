import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  email?: string;
}

type RawFarmer = Partial<Farmer> & {
  id?: string;
  email?: string;
  fullName?: string;
};

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

function normalizeFarmer(raw: RawFarmer | null | undefined, previous: Farmer | null = null): Farmer | null {
  const id = raw?.id || previous?.id;
  if (!id) return null;

  const nameFromRaw =
    typeof raw?.full_name === 'string'
      ? raw.full_name.trim()
      : typeof raw?.fullName === 'string'
        ? raw.fullName.trim()
        : '';

  const full_name = nameFromRaw || previous?.full_name || 'Farmer';

  const phone =
    raw?.phone === null
      ? null
      : typeof raw?.phone === 'string'
        ? raw.phone.trim() || null
        : previous?.phone ?? null;

  const language_preference =
    typeof raw?.language_preference === 'string' && raw.language_preference.trim()
      ? raw.language_preference
      : previous?.language_preference || 'en';

  const role = raw?.role === 'admin' || raw?.role === 'farmer' ? raw.role : previous?.role || 'farmer';

  const created_at =
    typeof raw?.created_at === 'string' && raw.created_at
      ? raw.created_at
      : previous?.created_at || new Date().toISOString();

  return {
    id,
    full_name,
    phone,
    language_preference,
    role,
    created_at,
  };
}

function normalizeUser(raw: { id?: string; email?: string } | null | undefined, previous: User | null = null): User | null {
  const id = raw?.id || previous?.id;
  if (!id) return null;

  return {
    id,
    email: typeof raw?.email === 'string' ? raw.email : previous?.email,
  };
}

function toAuthError(error: unknown): Error {
  if (error instanceof Error) {
    if (/failed to fetch|networkerror|load failed/i.test(error.message)) {
      return new Error(
        'Cannot connect to server. Please start backend server and try again.'
      );
    }
    return error;
  }

  return new Error('Authentication request failed');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshCurrentProfile(token: string, fallbackPayload?: RawFarmer) {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const profileData = await response.json();
        setUser((prevUser) => normalizeUser(profileData, prevUser));
        setFarmer((prevFarmer) => normalizeFarmer(profileData, prevFarmer));
        return;
      }
    } catch (error) {
      console.error('Error refreshing current profile:', error);
    }

    if (fallbackPayload) {
      setUser((prevUser) => normalizeUser(fallbackPayload, prevUser));
      setFarmer((prevFarmer) => normalizeFarmer(fallbackPayload, prevFarmer));
    }
  }

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
            setUser(normalizeUser(data));
            setFarmer(normalizeFarmer(data));
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
        body: JSON.stringify({ email, password, fullName, full_name: fullName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Signup failed');
      }

      const data = await response.json();
      const userPayload = (data.user || data) as RawFarmer;

      localStorage.setItem('auth_token', data.token);
      setUser(normalizeUser(userPayload));
      setFarmer(normalizeFarmer(userPayload));

      await refreshCurrentProfile(data.token, userPayload);
    } catch (error) {
      const authError = toAuthError(error);
      console.error('Signup error:', authError);
      throw authError;
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
      const userPayload = (data.user || data) as RawFarmer;

      localStorage.setItem('auth_token', data.token);
      setUser(normalizeUser(userPayload));
      setFarmer(normalizeFarmer(userPayload));

      await refreshCurrentProfile(data.token, userPayload);
    } catch (error) {
      const authError = toAuthError(error);
      console.error('Signin error:', authError);
      throw authError;
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
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let message = 'Profile update failed';
        try {
          const errorData = await response.json();
          if (errorData?.error) {
            message = errorData.error;
          }
        } catch {
          // Ignore JSON parsing errors for non-JSON responses.
        }
        throw new Error(message);
      }

      const updated = await response.json();
      setUser((prevUser) => normalizeUser(updated, prevUser));
      setFarmer((prevFarmer) => normalizeFarmer(updated, prevFarmer));
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
