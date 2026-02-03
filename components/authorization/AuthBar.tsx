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
  setIsOpenAuthPage: Dispatch<SetStateAction<boolean>>;
}

const AuthBar: React.FC<AuthBarProps> = ({user, handleLogout, setIsOpenAuthPage}) => {

  const [isOpenUserMenu, setIsOpenUserMenu] = useState(false);

  return (
    <div>
      {user ? (
        <div
          className='relative flex flex-row items-center gap-3 cursor-pointer'
          onClick={() => setIsOpenUserMenu(!isOpenUserMenu)}
        >
          <div className='flex flex-row items-center gap-2'>
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user ? user.name : 'unknown'}
                width={36}
                height={36}
                className='rounded-full ring-2 ring-amber-200 dark:ring-amber-600'
              />
            ) : (
              <div className='flex items-center justify-center w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'>
                <GiCook className='text-lg' />
              </div>
            )}
            <span className='text-gray-700 dark:text-gray-200 font-medium hidden lg:block'>{user?.name}</span>
          </div>

          {isOpenUserMenu && (
            <div id='aut__bar_overlay' className='fixed inset-0 min-h-screen' onClick={() => setIsOpenUserMenu(!isOpenUserMenu)}>
              <div className='absolute top-12 right-0 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-amber-100 dark:border-gray-700 overflow-hidden z-50'>
                <Link
                  href={PAGES.PROFILE(user.name)}
                  className='block px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors'
                >
                  Profile
                </Link>
                <button
                  className='w-full text-left px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
                  onClick={handleLogout}
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsOpenAuthPage(true)}
          className='px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-full transition-all shadow-md hover:shadow-lg'
        >
          Login
        </button>
      )}
    </div>
  );
};

export default AuthBar;