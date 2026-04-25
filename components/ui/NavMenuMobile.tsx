'use client';

import React from 'react';
import {Link, usePathname} from "@/i18n/navigation";
import {PAGES} from "@/config/page.config";
import {UserState} from "@/store/useUserStore";
import Image from "next/image";
import {FiUser} from "react-icons/fi";
import {useTranslations} from "next-intl";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

interface NavMenuMobileProps {
  user: UserState | null;
  isShowNav: boolean;
  setIsShowNav: (value: boolean) => void;
  handleLogout: () => void;
}

const NavMenuMobile: React.FC<NavMenuMobileProps> = ({
                                                       user,
                                                       isShowNav,
                                                       setIsShowNav,
                                                       handleLogout
                                                     }) => {
  const t = useTranslations('common');
  const pathname = usePathname();

  // Get user initial for avatar
  const getInitial = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setIsShowNav(false)}
        className={`fixed inset-0 transition-opacity duration-300 ${
          isShowNav ? 'opacity-100 pointer-events-auto z-100 ' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          WebkitBackdropFilter: 'blur(2px)',
          backdropFilter: 'blur(2px)'
        }}
      />

      {/* Slide-in Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[72%] max-w-[300px] flex flex-col transition-transform duration-300 ease-out ${
          isShowNav ? 'translate-x-0 z-200' : 'translate-x-full'
        }`}
        style={{
          backgroundColor: 'var(--bg)',
          borderLeft: '1px solid var(--border)'
        }}
      >
        {/* User block */}
        <div className="p-6 pb-5 border-b border-border">
          <div className="flex justify-between items-start mb-4">
            {/* Avatar */}
            {user ? (
              user.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={user.name || 'User'}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-sm font-semibold text-text">
                  {getInitial()}
                </div>
              )
            ) : (
              <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center">
                <FiUser className="text-base text-muted"/>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={() => setIsShowNav(false)}
              className="w-7 h-7 flex items-center justify-center border border-border text-muted hover:text-text text-sm transition-colors"
            >
              ✕
            </button>
          </div>

          {/* User info */}
          {user ? (
            <Link
              href={PAGES.PROFILE(user.id)}
              onClick={() => setIsShowNav(false)}
            >
              <div className="text-[15px] text-text font-medium">
                {user.name || 'User'}
              </div>
              <div className="text-[11px] text-muted mt-1 tracking-wide">
                {user.email}
              </div>
            </Link>
          ) : (
            <>
              <div className="text-[15px] text-text font-medium">
                {t('auth.welcomeGuest')}
              </div>
              <div className="text-[11px] text-muted mt-1 tracking-wide">
                {t('auth.guestDescription')}
              </div>
            </>
          )}
        </div>

        {/* Navigation links */}
        <div className="flex-1 py-3 overflow-y-auto">
          <Link
            href={PAGES.HOME}
            onClick={() => setIsShowNav(false)}
            className="flex items-center justify-between px-6 py-3.5 cursor-pointer hover:bg-surface transition-colors"
          >
            <span className="text-[15px] text-text font-light tracking-tight">
              {t('nav.home')}
            </span>
            <span className="text-xs text-muted">→</span>
          </Link>

          <Link
            href={PAGES.RECIPES}
            onClick={() => setIsShowNav(false)}
            className="flex items-center justify-between px-6 py-3.5 cursor-pointer hover:bg-surface transition-colors"
          >
            <span className="text-[15px] text-text font-light tracking-tight">
              {t('nav.recipes')}
            </span>
            <span className="text-xs text-muted">→</span>
          </Link>

          <Link
            href={PAGES.ABOUT}
            onClick={() => setIsShowNav(false)}
            className="flex items-center justify-between px-6 py-3.5 cursor-pointer hover:bg-surface transition-colors"
          >
            <span className="text-[15px] text-text font-light tracking-tight">
              {t('nav.about')}
            </span>
            <span className="text-xs text-muted">→</span>
          </Link>

          {user?.role === 'admin' && (
            <Link
              href={PAGES.ADMIN_PANEL}
              onClick={() => setIsShowNav(false)}
              className="flex items-center justify-between px-6 py-3.5 cursor-pointer hover:bg-surface transition-colors"
            >
              <span className="text-[15px] text-accent font-light tracking-tight">
                {t('nav.adminPanel')}
              </span>
              <span className="text-xs text-muted">→</span>
            </Link>
          )}

          {/* Divider */}
          <div className="mx-6 my-2 border-t border-border"/>

          {/* Profile & Sign out / Sign in */}
          {user ? (
            <>
              <Link
                href={PAGES.PROFILE(user.name || user.id)}
                onClick={() => setIsShowNav(false)}
                className="block px-6 py-3.5 cursor-pointer hover:bg-surface transition-colors"
              >
                <span className="text-[15px] text-text font-light">
                  {t('auth.profile')}
                </span>
              </Link>

              <button
                onClick={() => {
                  handleLogout();
                  setIsShowNav(false);
                }}
                className="w-full text-left px-6 py-3.5 cursor-pointer hover:bg-surface transition-colors"
              >
                <span className="text-[15px] font-light text-red-500 dark:text-red-400">
                  {t('auth.logout')}
                </span>
              </button>
            </>
          ) : (
            <>
              <Link
                href={PAGES.SIGNIN(pathname)}
                onClick={() => setIsShowNav(false)}
                className="block px-6 py-3.5 cursor-pointer hover:bg-surface transition-colors"
              >
                <span className="text-[15px] text-accent font-light">
                  {t('auth.signIn')}
                </span>
              </Link>

              <Link
                href={PAGES.SIGNUP(pathname)}
                onClick={() => setIsShowNav(false)}
                className="block px-6 py-3.5 cursor-pointer hover:bg-surface transition-colors"
              >
                <span className="text-[15px] text-text font-light">
                  {t('auth.createAccount')}
                </span>
              </Link>
            </>
          )}
        </div>

        {/* Bottom bar: Language + Version */}
        <div className="px-6 py-4 pb-7 border-t border-border flex items-center justify-between">
          <LanguageSwitcher/>
        </div>
      </div>
    </>
  );
};

export default NavMenuMobile;
