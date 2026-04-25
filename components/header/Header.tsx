'use client'

import React, {useEffect, useState} from 'react';
import {Link} from "@/i18n/navigation";
import {PAGES} from '@/config/page.config'
import {getUser, getUserProfile, logout} from '@/lib/supabase/authClient'
import {supabase} from '@/lib/supabase/ClientComponentClient'
import {useUserStore} from "@/store/useUserStore";
import ToggleTheme from "@/components/ui/ToggleTheme";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import NavMenuMobile from "@/components/ui/NavMenuMobile";
import AuthBar from "@/components/authentication/AuthBar";
import {useTranslations} from "next-intl";


const Header: React.FC = () => {
  const [isShowNav, setIsShowNav] = useState<boolean>(false);
  const {user, setUserData} = useUserStore();
  const t = useTranslations('common');


  useEffect(() => {
    const fetchUser = async () => {
      const user = await getUser();

      if(!!user) {
        const profile = await getUserProfile(user.id);

        if(!!profile) {
          setUserData({
            ...profile
          });
        }
      }
    }

    fetchUser();
  }, []);

  useEffect(() => {
    const {data: {subscription}} = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUserData(null);
      } else if(event === 'SIGNED_IN') {
        setUserData(user);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUserData, user]);

  const handleLogout = async () => {
    await logout();

    setUserData(null);
    setIsShowNav(false);
  }

  return (
    <header className='sticky top-0 z-50 h-12 md:h-14 bg-bg border-b border-border flex items-center justify-between px-4 sm:px-6 lg:px-10 shrink-0'>
      {/* Left side: Logo + Desktop Navigation */}
      <div className='flex items-center gap-10'>
        {/* Logo */}
        <Link href={PAGES.HOME} className='font-serif text-lg text-text'>
          Sweet Recipes
        </Link>

        {/* Desktop Navigation */}
        <nav className='hidden lg:flex items-center gap-6'>
          <Link href={PAGES.HOME} className='text-sm text-muted hover:text-text transition-colors'>
            {t('nav.home')}
          </Link>
          <Link href={PAGES.RECIPES} className='text-sm text-muted hover:text-text transition-colors'>
            {t('nav.recipes')}
          </Link>
          <Link href={PAGES.ABOUT} className='text-sm text-muted hover:text-text transition-colors'>
            {t('nav.about')}
          </Link>
          {user?.role === 'admin' && (
            <Link href={PAGES.ADMIN_PANEL} className='text-sm text-accent hover:opacity-80 transition-opacity'>
              {t('nav.adminPanel')}
            </Link>
          )}
        </nav>
      </div>

      {/* Right side controls */}
      <div className='flex items-center gap-3'>
        {/* Auth bar - desktop only */}
        <div className='hidden lg:block'>
          <AuthBar user={user} handleLogout={handleLogout}/>
        </div>

        {/* Language switcher - hidden on mobile */}
        <div className='hidden sm:block'>
          <LanguageSwitcher/>
        </div>

        {/* Theme toggle */}
        <ToggleTheme/>

        {/* Mobile menu button */}
        <button
          className='lg:hidden w-9 h-9 flex items-center justify-center text-xl text-muted hover:text-text transition-colors'
          onClick={() => setIsShowNav(!isShowNav)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </div>

      <NavMenuMobile
        user={user}
        isShowNav={isShowNav}
        setIsShowNav={setIsShowNav}
        handleLogout={handleLogout}
      />
    </header>
  );
};

export default Header;
