'use client';

import React, {useState} from 'react';
import Image from "next/image";
import {IUserState} from "@/store/useUserStore";
import AuthPage from "@/components/authorization/AuthPage";

interface AuthBarProps {
  user: IUserState | null;
  handleLogout: () => void;
}

const AuthBar: React.FC<AuthBarProps> = ({user, handleLogout}) => {
  const [isOpenLoginPage, setIsOpenLoginPage] = useState(false);

  return (
    <div>
      {user
        ? (<div className='flex flex-row items-center md:justify-around gap-3 justify-between md:w-full'>
          <div className='flex flex-row items-center gap-3'>
            <Image
              src={user ? user.avatar_url : "https://c0.klipartz.com/pngpicture/722/101/gratis-png-iconos-de-computadora-perfil-de-usuario-circulo-abstracto.png"}
              alt={user ? user.name : 'unknown'}
              width={35}
              height={35}
              className='rounded-full'
            />
            <div>{user?.name}</div>
          </div>
          <button className='rounded-xl border border-pink-400 p-1.5 text-s bg-pink-300 duration-300 hover:-rotate-2 hover:scale-95 hover:-translate-0.5 transition'
                  onClick={handleLogout}
          >Sign out
          </button>
        </div>)
        : <button onClick={() => setIsOpenLoginPage(true)}>Login</button>}
      {isOpenLoginPage && (
        <AuthPage setIsOpenLoginPage={setIsOpenLoginPage}/>
      )}
    </div>
  );
};

export default AuthBar;