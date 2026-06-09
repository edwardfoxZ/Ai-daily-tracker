import { create } from 'zustand';

interface User {
  address: string;
  username?: string;
  email?: string;
  profilePic?: string;
}

interface AuthState {
  user: User | null;
  isConnected: boolean;
  setUser: (user: User) => void;
  disconnect: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isConnected: false,
  setUser: (user) => set({ user, isConnected: true }),
  disconnect: () => set({ user: null, isConnected: false }),
}));