import {create} from "zustand/react";

export type UserRole = 'admin' | 'user';

export interface IUserState {
  name: string;
  avatar_url: string | null;
  role: UserRole;
  email: string;
}

interface IAdminStore {
  user: null | IUserState;
  setUserData: (data: IUserState | null) => void;
}

export const useUserStore = create<IAdminStore>((set) => ({
  user: null,
  setUserData: (data) => {
    set({
      user: data
    });
  }
}))