'use client'

import React, {useEffect, useState} from 'react';
import {Link} from "@/i18n/navigation";
import {PAGES} from '@/config/page.config'
import {logout} from '@/lib/supabase/authClient'
import {supabase} from '@/lib/supabase/ClientComponentClient'
import {UserState, useUserStore} from "@/store/useUserStore";
import ToggleTheme from "@/components/ui/ToggleTheme";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import NavMenuMobile from "@/components/ui/NavMenuMobile";
import AuthBar from "@/components/authorization/AuthBar";
import {useTranslations} from "next-intl";
import logoImage from "@/public/images/logo/logo.jpg"
import Image from "next/image";

interface HeaderProps {
  initUser: UserState | null;
}

const Header: React.FC<HeaderProps> = ({initUser}) => {
  const [isShowNav, setIsShowNav] = useState<boolean>(false);
  const {user, setUserData, initUser: initUserStore} = useUserStore();
  const t = useTranslations('common');

  // Инициализация store синхронно при первом рендере
  initUserStore(initUser);

  // Используем initUser как fallback пока store пустой
  const displayUser = user ?? initUser;

  useEffect(() => {
    const {data: {subscription}} = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUserData(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUserData]);

  const handleLogout = async () => {
    await logout();

    setUserData(null);
    setIsShowNav(false);
  }

  return (
    <section className='sticky top-2 z-50'>
      <menu className='max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-3rem)] md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg mt-2 px-4 sm:px-6 py-3 md:py-2 flex items-center justify-between shadow-lg border border-amber-100 dark:border-gray-700'>

        <div className='flex items-center justify-between w-full lg:hidden'>
          <div className='flex flex-col items-center justify-between gap-1.5 cursor-pointer p-2'
               onClick={() => setIsShowNav(!isShowNav)}>
            <span className='w-7 h-0.5 bg-amber-600 dark:bg-amber-400 rounded-full transition-all'></span>
            <span className='w-7 h-0.5 bg-amber-600 dark:bg-amber-400 rounded-full transition-all'></span>
            <span className='w-7 h-0.5 bg-amber-600 dark:bg-amber-400 rounded-full transition-all'></span>
          </div>
        </div>
        <Link href={PAGES.HOME}
              className='absolute left-1/2 -translate-x-1/2 lg:hidden'>
          <Image
            src={logoImage}
            alt="Sweet Recipes"
            width={90}
          />
        </Link>

        <nav className='hidden items-center justify-start gap-6 w-2/3 lg:flex text-sm lg:text-base'>
          <Link href={PAGES.HOME}
                className='relative group'>
            <Image
              src={logoImage}
              alt="Sweet Recipes"
              width={90}
            />
          </Link>
          <Link href={PAGES.HOME}
                className='text-gray-700 dark:text-gray-200 hover:text-amber-600 dark:hover:text-amber-400 font-medium transition-colors'>
            {t('nav.home')}
          </Link>
          <Link href={PAGES.RECIPES}
                className='text-gray-700 dark:text-gray-200 hover:text-amber-600 dark:hover:text-amber-400 font-medium transition-colors'>
            {t('nav.recipes')}
          </Link>
          <Link href={PAGES.ABOUT}
                className='text-gray-700 dark:text-gray-200 hover:text-amber-600 dark:hover:text-amber-400 font-medium transition-colors'>
            {t('nav.about')}
          </Link>
          {displayUser?.role === 'admin' && (
            <Link href={PAGES.ADMIN_PANEL}
                  className='text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium transition-colors'>
              {t('nav.adminPanel')}
            </Link>
          )}
        </nav>
        <div className='flex flex-row items-center justify-end gap-4 w-1/3'>
          <div className='hidden lg:block'>
            <AuthBar user={displayUser}
                     handleLogout={handleLogout}/>
          </div>
          <div className='hidden lg:block'>
            <LanguageSwitcher/>
          </div>
          <ToggleTheme/>
        </div>

      </menu>
      <NavMenuMobile user={displayUser}
                     isShowNav={isShowNav}
                     setIsShowNav={setIsShowNav}
                     handleLogout={handleLogout}/>
    </section>
  );
};

export default Header;