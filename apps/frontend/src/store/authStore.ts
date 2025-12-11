import { create } from 'zustand';
import { api } from '@/lib/api';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  setAuth: (user: User, token: string) => void;
  setLoading: (loading: boolean) => void;
}

// Initialize state from localStorage if available
const getInitialState = () => {
  if (typeof window === 'undefined') {
    return {
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    };
  }

  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      // Set axios header on initialization
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return {
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      };
    } catch (error) {
      console.error('Failed to parse stored user:', error);
    }
  }

  return {
    user: null,
    token: null,
    isLoading: false,
    isAuthenticated: false,
  };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...getInitialState(),

  setLoading: (loading) => set({ isLoading: loading }),

  setAuth: (user, token) => {
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    // Update axios default header
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    set({ user, token, isAuthenticated: true });
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true });
      
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data.data;
      
      get().setAuth(user, token);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    // Remove from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    // Remove axios header
    delete api.defaults.headers.common['Authorization'];
    
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      set({ isLoading: true });
      
      // Load from localStorage first
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          const user = JSON.parse(userStr);
          
          // Set token in axios
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Set auth immediately from localStorage (don't wait for API)
          set({ user, token, isAuthenticated: true });
          
          // Verify token by fetching current user in background
          try {
            const response = await api.get('/auth/me');
            const currentUser = response.data.data;
            
            // Update with fresh data from server
            set({ user: currentUser, token, isAuthenticated: true });
          } catch (error) {
            // Token invalid, clear auth
            console.error('Token verification failed:', error);
            get().logout();
          }
        }
      }
    } catch (error) {
      console.error('Load user error:', error);
      get().logout();
    } finally {
      set({ isLoading: false });
    }
  },
}));
