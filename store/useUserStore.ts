import {create} from "zustand/react";

export type UserRole = 'admin' | 'user';

export interface IUserState {
  id: string;
  name: string;
  avatar_url: string | null;
  role: UserRole;
  email: string;
}

interface IAdminStore {
  user: undefined | null | IUserState;
  setUserData: (data: IUserState | null) => void;
}

export const useUserStore = create<IAdminStore>((set) => ({
  user: undefined,
  setUserData: (data) => {
    set({
      user: data
    });
  }
}))