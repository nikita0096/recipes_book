'use client'

import React, {useEffect, useState} from 'react';
import Link from "next/link";
import {PAGES} from '@/config/page.config'
import {handleGoogleLogin, logout, getUser} from '@/supabase/authClient'
import {useUserStore} from "@/store/useUserStore";
import ToggleTheme from "@/components/ui/ToggleTheme";
import NavMenuMobile from "@/components/ui/NavMenuMobile";
import AuthBar from "@/components/ui/AuthBar";

const Header: React.FC = () => {
  const [isShowNav, setIsShowNav] = useState<boolean>(false);
  const {user, setUserData} = useUserStore();

  const handleLogin = async () => {
    try {
      await handleGoogleLogin();
    } catch (error) {
      console.error(error);
    }
  }

  const handleLogout = async () => {
    await logout();

    setUserData(null);
    setIsShowNav(false);
  }

  useEffect(() => {
    const checkUser = async () => {
      const data = await getUser();

      if (data) {
        const {name, avatar_url, role} = data?.user_metadata;

        setUserData({
          name: name,
          avatar_url: avatar_url,
          role: !!role,
        });
      }
    }

    checkUser();
  }, []);

  return (
    <menu className='sticky top-2 xl:max-w-6xl lg:max-w-5xl md:max-w-3xl md:mx-auto mx-6 rounded-3xl bg-pink-100/50 dark:bg-black/50 backdrop-blur-lg mt-2 px-8 py-4 md:py-2 flex items-center justify-between'>

      <div className='flex items-center justify-between w-full md:hidden'>
        <div className='flex flex-col items-center justify-between gap-1'
             onClick={() => setIsShowNav(!isShowNav)}>
          <span className='w-9 h-1 bg-gray-700 dark:bg-pink-100 rounded '></span>
          <span className='w-9 h-1 bg-gray-700 dark:bg-pink-100 rounded '></span>
          <span className='w-9 h-1 bg-gray-700 dark:bg-pink-100 rounded '></span>
        </div>
      </div>
      <Link href={PAGES.HOME}
            className='absolute left-1/2 -translate-x-1/2 bg-gray-200 dark:bg-pink-100 md:hidden text-black  rounded-xl p-2 text-sm lg:text-md'>
        Recipes Book
        <p className='absolute top-7 -right-1 bg-pink-300 rounded-xl px-2 text-[8px] text-white'>by Lady Stohantseva</p>
      </Link>
      <NavMenuMobile user={user}
                     isShowNav={isShowNav}
                     setIsShowNav={setIsShowNav} handleLogin={handleLogin} handleLogout={handleLogout}/>

      <nav className='hidden items-center justify-start gap-5 w-2/3 md:flex text-sm lg:text-lg'>
        <Link href={PAGES.HOME}
              className='relative bg-gray-200 dark:bg-pink-100 text-black  rounded-xl p-2 text-sm lg:text-md hover:-rotate-2 hover:scale-95 hover:-translate-0.5 transition'>
          Recipes Book
          <p className='absolute top-7 -right-1 bg-pink-300 rounded-xl px-2 text-[8px] text-white'>by Lady Stohantseva</p>
        </Link>
        <Link href={PAGES.HOME}>Home</Link>
        <Link href={PAGES.RECIPES}>Recipes</Link>
        <Link href={PAGES.SOCIAL}>Social media</Link>
        {user?.role && <Link href={PAGES.ADMIN_PANEL}>Admin panel</Link>}
      </nav>
      <div className='flex flex-row items-center justify-end gap-5 w-1/3'>
        <div className='hidden md:block'>
          <AuthBar user={user}
                   handleLogin={handleLogin}
                   handleLogout={handleLogout}/>
        </div>
        <ToggleTheme/>
      </div>
    </menu>
  );
};

export default Header;