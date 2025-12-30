import {create} from "zustand/react";

export interface IUserState {
  name: string;
  avatar_url: string;
  role: boolean;
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