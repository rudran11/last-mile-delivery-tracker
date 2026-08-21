import { create } from 'zustand';
import { api } from '../services/ApiClient';

export type UserRole = 'CUSTOMER' | 'AGENT' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  initialize: () => void;
}

// In Sprint 2, the JWT holds { userId, role }. The backend doesn't currently expose a `/me` endpoint
// to fetch full profile. For a real app we'd decode JWT or fetch `/me`.
// To stay true to backend, we'll store the user payload returned by login.

export const useAuthStore = create<AuthState>((set) => {
  // Listen for 401 unauthorized from API client
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:unauthorized', () => {
      set({ user: null, isAuthenticated: false });
    });
  }

  return {
    user: null,
    isAuthenticated: false,
    isInitializing: true,
    
    login: (token, user) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    },
    
    logout: () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      set({ user: null, isAuthenticated: false });
    },
    
    initialize: () => {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ user, isAuthenticated: true, isInitializing: false });
        } catch (e) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          set({ user: null, isAuthenticated: false, isInitializing: false });
        }
      } else {
        set({ isInitializing: false });
      }
    }
  };
});
