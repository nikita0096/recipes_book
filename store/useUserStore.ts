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
  setUserData: (data: UserState | null) => void;
}

export const useUserStore = create<IUserStore>((set, get) => ({
  user: null,
  setUserData: (data) => {
    set({ user: data });
  }
}))