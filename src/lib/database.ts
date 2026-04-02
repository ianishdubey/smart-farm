// API client for the backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

let authToken: string | null = localStorage.getItem('auth_token');

const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

const getAuthToken = () => authToken || localStorage.getItem('auth_token');

const apiRequest = async (endpoint: string, options: RequestOptions = {}) => {
  const url = `${API_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      if (response.status === 401) {
        setAuthToken(null);
        throw new Error('Authentication failed. Please log in again.');
      }
      const error = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
      throw new Error(error.error || `API error: ${response.status}`);
    }

    return response.json();
  } catch (error: any) {
    // Check if it's a network error
    if (error.message === 'Failed to fetch' || error instanceof TypeError) {
      throw new Error(`Unable to connect to server. Is the backend running on ${API_URL}?`);
    }
    throw error;
  }
};

export const db = {
  // Auth
  auth: {
    signUp: async (email: string, password: string, fullName: string) => {
      try {
        const data = await apiRequest('/auth/signup', {
          method: 'POST',
          body: { email, password, fullName },
        });
        setAuthToken(data.token);
        return { data: { user: data.user }, error: null };
      } catch (error: any) {
        return { data: null, error };
      }
    },

    signInWithPassword: async (email: string, password: string) => {
      try {
        const data = await apiRequest('/auth/signin', {
          method: 'POST',
          body: { email, password },
        });
        setAuthToken(data.token);
        return { error: null };
      } catch (error) {
        return { error };
      }
    },

    signOut: async () => {
      setAuthToken(null);
      return { error: null };
    },

    getSession: async () => {
      const token = getAuthToken();
      if (!token) return { data: { session: null } };
      try {
        const user = await apiRequest('/auth/me');
        return { data: { session: { user: { id: user.id, email: user.email } } } };
      } catch {
        setAuthToken(null);
        return { data: { session: null } };
      }
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      // Simple implementation - can be enhanced with proper event handling
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    },
  },

  // Generic table operations
  from: (tableName: string) => {
    return {
      select: (columns = '*') => ({
        eq: (column: string, value: any) => ({
          maybeSingle: async () => {
            try {
              if (tableName === 'farmers') {
                const data = await apiRequest('/auth/me');
                return { data: data || null, error: null };
              } else if (tableName === 'farms') {
                const data = await apiRequest('/farms');
                return { data: data || null, error: null };
              }
              return { data: null, error: null };
            } catch (error) {
              return { data: null, error };
            }
          },
          single: async () => {
            try {
              const data = await apiRequest(`/${tableName}/${value}`);
              return { data, error: null };
            } catch (error) {
              return { data: null, error };
            }
          },
          order: (field: string, options?: { ascending: boolean }) => ({
            then: async () => {
              try {
                const data = await apiRequest(`/${tableName}?${column}=${value}&orderBy=${field}&order=${options?.ascending ? 'asc' : 'desc'}`);
                return { data, error: null };
              } catch (error) {
                return { data: null, error };
              }
            },
          }),
        }),
        order: (field: string, options?: { ascending: boolean }) => ({
          then: async () => {
            try {
              const data = await apiRequest(`/${tableName}?orderBy=${field}&order=${options?.ascending ? 'asc' : 'desc'}`);
              return { data, error: null };
            } catch (error) {
              return { data: null, error };
            }
          },
        }),
      }),
      insert: (data: any) => ({
        then: async () => {
          try {
            const result = await apiRequest(`/${tableName}`, {
              method: 'POST',
              body: data,
            });
            return { data: result, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
        select: () => ({
          single: async () => {
            try {
              const result = await apiRequest(`/${tableName}`, {
                method: 'POST',
                body: data,
              });
              return { data: result, error: null };
            } catch (error) {
              return { data: null, error };
            }
          },
        }),
      }),
      update: (updateData: any) => ({
        eq: (column: string, value: any) => ({
          then: async () => {
            try {
              const result = await apiRequest(`/${tableName}/${value}`, {
                method: 'PUT',
                body: updateData,
              });
              return { error: null };
            } catch (error) {
              return { error };
            }
          },
        }),
      }),
      delete: async () => {
        try {
          await apiRequest(`/${tableName}`, { method: 'DELETE' });
          return { error: null };
        } catch (error) {
          return { error };
        }
      },
    };
  },
};

// Re-export for compatibility
export const supabase = db;

export { setAuthToken, getAuthToken };
