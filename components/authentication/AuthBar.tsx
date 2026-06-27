'use client';

import './auth.module.css'
import React, {useState} from 'react';
import Image from "next/image";
import {UserState} from "@/store/useUserStore";
import {Link} from "@/i18n/navigation";
import {PAGES} from "@/config/page.config";
import {useTranslations} from "next-intl";
import {usePathname} from "@/i18n/navigation";
import ChefPlaceholder from "@/components/ui/ChefPlaceholder";

interface AuthBarProps {
  user: UserState | null;
  handleLogout: () => void;
}

const AuthBar: React.FC<AuthBarProps> = ({user, handleLogout}) => {
  const [isOpenUserMenu, setIsOpenUserMenu] = useState(false);
  const t = useTranslations('common');

  const pathname = usePathname();

  return (
    <div>
      {user ? (
        <div
          className='relative flex flex-row items-center gap-3 cursor-pointer'
          onClick={() => setIsOpenUserMenu(!isOpenUserMenu)}
        >
          {/* Avatar */}
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.name || 'User'}
              width={30}
              height={30}
              sizes="30px"
              className='rounded-full'
            />
          ) : (
            <div className='w-[30px] h-[30px] rounded-full overflow-hidden'>
              <ChefPlaceholder />
            </div>
          )}

          {/* Username */}
          <span className='text-sm text-muted'>
            {user.name || user.email}
          </span>

          {/* Dropdown menu */}
          {isOpenUserMenu && (
            <div
              className='fixed inset-0 min-h-screen z-40'
              onClick={(e) => {
                e.stopPropagation();
                setIsOpenUserMenu(false);
              }}
            >
              <div
                className='absolute top-14 right-0 w-48 bg-surface border border-border overflow-hidden z-50'
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  href={PAGES.PROFILE(user.id)}
                  className='block px-4 py-3 text-sm text-text hover:bg-bg transition-colors'
                  onClick={() => setIsOpenUserMenu(false)}
                >
                  {t('auth.profile')}
                </Link>
                <button
                  className='w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-bg transition-colors'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                    setIsOpenUserMenu(false);
                  }}
                >
                  {t('auth.logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ═══ Guest - Sign in button ═══ */
        <Link
          href={PAGES.SIGNIN(pathname)}
          className='px-5 py-2 bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity'
        >
          {t('auth.signIn')}
        </Link>
      )}
    </div>
  );
};

export default AuthBar;
