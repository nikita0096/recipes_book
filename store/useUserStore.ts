import {create} from "zustand/react";

export type UserRole = 'admin' | 'user';

export interface UserState {
  id: string;
  name: string;
  avatar_url: string | null;
  role: UserRole;
  email: string;
  createdAt: string;
}

interface IUserStore {
  user: null | UserState;
  isHydrated: boolean;
  setUserData: (data: UserState | null) => void;
  initUser: (data: UserState | null) => void;
}

export const useUserStore = create<IUserStore>((set, get) => ({
  user: null,
  isHydrated: false,
  setUserData: (data) => {
    set({ user: data });
  },
  initUser: (data) => {
    // Инициализируем только один раз
    if (!get().isHydrated) {
      set({ user: data, isHydrated: true });
    }
  }
}))