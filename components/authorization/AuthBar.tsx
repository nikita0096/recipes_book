'use client';

import './auth.module.css'
import React, {Dispatch, SetStateAction, useState} from 'react';
import Image from "next/image";
import {IUserState} from "@/store/useUserStore";
import AuthPage from "@/components/authorization/AuthPage";
import { GiCook } from "react-icons/gi";
import Link from "next/link";
import {PAGES} from "@/config/page.config";
import {IoClose} from "react-icons/io5";

interface AuthBarProps {
  user: IUserState | null;
  handleLogout: () => void;
  isOpenLoginPage: boolean;
  setIsOpenLoginPage: Dispatch<SetStateAction<boolean>>;
}

const AuthBar: React.FC<AuthBarProps> = ({user, handleLogout, isOpenLoginPage, setIsOpenLoginPage}) => {

  const [isOpenUserMenu, setIsOpenUserMenu] = useState(false);

  return (
    <div>
      {user
        ? (<div className='relative flex flex-row items-center md:justify-around gap-3 justify-between md:w-full cursor-pointer' onClick={() => setIsOpenUserMenu(!isOpenUserMenu)}>
          <div className='flex flex-row items-center gap-3'>
            {user.avatar_url
              ? <Image
                src={user.avatar_url}
                alt={user ? user.name : 'unknown'}
                width={35}
                height={35}
                className='rounded-full'
              />
              : <div className='flex items-center justify-center border rounded-full p-1'>
                <GiCook className='text-xl'/>
              </div>
            }

            <div>{user?.name}</div>
          </div>
          {/*<button className='rounded-xl border border-pink-400 p-1.5 text-s bg-pink-300 duration-300 hover:-rotate-2 hover:scale-95 hover:-translate-0.5 transition'*/}
          {/*        onClick={handleLogout}*/}
          {/*>Sign out*/}
          {/*</button>*/}

          {isOpenUserMenu && (
            <div className='absolute -bottom-22 -left-7 w-45 bg-pink-100 dark:bg-gray-700 flex flex-col items-start justify-center gap-1 p-2 rounded-b-xl rounded-r-xl'>
              <Link href={PAGES.PROFILE(user.name)} className='px-2 text-xl'>Profile</Link>
              <button className='text-red-500 px-2 text-xl cursor-pointer' onClick={handleLogout}>Sign out</button>
              <IoClose className='absolute top-2 right-2 text-xl cursor-pointer'
                       onClick={() => setIsOpenUserMenu(false)}/>
            </div>
          )}
        </div>)
        : <button onClick={() => setIsOpenLoginPage(true)}>Login</button>}

    </div>
  );
};

export default AuthBar;