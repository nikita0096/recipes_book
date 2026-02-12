'use client'

import React, {useEffect, useState} from 'react';
import {Link} from "@/i18n/navigation";
import {PAGES} from '@/config/page.config'
import {logout, getUser, getUserProfile} from '@/lib/supabase/authClient'
import {supabase} from '@/lib/supabase/ClientComponentClient'
import {useUserStore} from "@/store/useUserStore";
import ToggleTheme from "@/components/ui/ToggleTheme";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import NavMenuMobile from "@/components/ui/NavMenuMobile";
import AuthBar from "@/components/authorization/AuthBar";
import AuthPage from "@/components/authorization/AuthPage";
import {useTranslations} from "next-intl";

const Header: React.FC = () => {
  const [isShowNav, setIsShowNav] = useState<boolean>(false);
  const [isOpenAuthPage, setIsOpenAuthPage] = useState(false);
  const {user, setUserData} = useUserStore();
  const t = useTranslations('common');

  const handleLogout = async () => {
    await logout();

    setUserData(null);
    setIsShowNav(false);
  }

  useEffect(() => {
    const updateUserData = async () => {
      const data = await getUser();

      if (data) {
        const {name, avatar_url} = data?.user_metadata;
        const profile = await getUserProfile(data.id);

        setUserData({
          name: name || '',
          avatar_url: avatar_url || '',
          role: profile?.role || 'user',
          email: data?.email || '',
        });
      }
    }

    updateUserData();

    const {data: {subscription}} = supabase.auth.onAuthStateChange((event) => {

      if (event === 'SIGNED_IN') {
        updateUserData();
      } else if (event === 'SIGNED_OUT') {
        setUserData(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUserData]);

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
          <span className='bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl px-3 py-1.5 text-sm shadow-md'>
            {t('header.brand')}
          </span>
          <p className='absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-200 dark:bg-amber-700 rounded-full px-2 text-[8px] text-amber-800 dark:text-amber-100 whitespace-nowrap'>
            {t('header.byAuthor')}</p>
        </Link>

        <nav className='hidden items-center justify-start gap-6 w-2/3 lg:flex text-sm lg:text-base'>
          <Link href={PAGES.HOME}
                className='relative group'>
            <span className='bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl px-3 py-1.5 shadow-md group-hover:shadow-lg transition-all group-hover:scale-105'>
              {t('header.brand')}
            </span>
            <p className='absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-200 dark:bg-amber-700 rounded-full px-2 text-[8px] text-amber-800 dark:text-amber-100 whitespace-nowrap'>
              {t('header.byAuthor')}</p>
          </Link>
          <Link href={PAGES.HOME}
                className='text-gray-700 dark:text-gray-200 hover:text-amber-600 dark:hover:text-amber-400 font-medium transition-colors'>
            {t('nav.home')}
          </Link>
          <Link href={PAGES.RECIPES}
                className='text-gray-700 dark:text-gray-200 hover:text-amber-600 dark:hover:text-amber-400 font-medium transition-colors'>
            {t('nav.recipes')}
          </Link>
          <Link href={PAGES.SOCIAL}
                className='text-gray-700 dark:text-gray-200 hover:text-amber-600 dark:hover:text-amber-400 font-medium transition-colors'>
            {t('nav.socialMedia')}
          </Link>
          {user?.role === 'admin' && (
            <Link href={PAGES.ADMIN_PANEL}
                  className='text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium transition-colors'>
              {t('nav.adminPanel')}
            </Link>
          )}
        </nav>
        <div className='flex flex-row items-center justify-end gap-4 w-1/3'>
          <div className='hidden lg:block'>
            <AuthBar user={user}
                     handleLogout={handleLogout}
                     setIsOpenAuthPage={setIsOpenAuthPage}/>
          </div>
          <div className='hidden lg:block'>
            <LanguageSwitcher/>
          </div>
          <ToggleTheme/>
        </div>

      </menu>
      <NavMenuMobile user={user}
                     isShowNav={isShowNav}
                     setIsShowNav={setIsShowNav}
                     handleLogout={handleLogout}
                     setIsOpenAuthPage={setIsOpenAuthPage}/>
      {isOpenAuthPage && (
        <AuthPage setIsOpenAuthPage={setIsOpenAuthPage}/>
      )}
    </section>
  );
};

export default Header;