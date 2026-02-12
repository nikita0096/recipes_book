import React, {Dispatch, SetStateAction} from 'react';
import {Link} from "@/i18n/navigation";
import {PAGES} from "@/config/page.config";
import {IUserState} from "@/store/useUserStore";
import {IoClose} from "react-icons/io5";
import Image from "next/image";
import {GiCook} from "react-icons/gi";
import {useTranslations} from "next-intl";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

interface NavMenuMobileProps {
  user: IUserState | null;
  isShowNav: boolean;
  setIsShowNav: (value: boolean) => void;
  handleLogout: () => void;
  setIsOpenAuthPage: Dispatch<SetStateAction<boolean>>;
}

const NavMenuMobile: React.FC<NavMenuMobileProps> = ({
                                                       user,
                                                       isShowNav,
                                                       setIsShowNav,
                                                       handleLogout,
                                                       setIsOpenAuthPage
                                                     }) => {
  const t = useTranslations('common');

  return (
      <>
        {isShowNav && (
          <div className='fixed inset-0 w-full h-screen bg-amber-50/50 dark:bg-black/50  overflow-hidden' onClick={() => setIsShowNav(false)}>
            <div className={isShowNav ? 'absolute top-2 left-0 right-0 mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-amber-100 dark:border-gray-700 z-50 overflow-hidden duration-300 transition-all' : 'absolute -top-50 -left-50 right-0 mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-amber-100 dark:border-gray-700 z-50 overflow-hidden duration-1000 transition-all'}>
              <nav className='flex flex-col p-6 gap-4'>
                <Link
                  onClick={() => setIsShowNav(false)}
                  href={PAGES.HOME}
                  className='text-gray-700 dark:text-gray-200 hover:text-amber-600 dark:hover:text-amber-400 font-medium text-lg transition-colors py-2 border-b border-amber-100 dark:border-gray-700'
                >
                  {t('nav.home')}
                </Link>
                <Link
                  onClick={() => setIsShowNav(false)}
                  href={PAGES.RECIPES}
                  className='text-gray-700 dark:text-gray-200 hover:text-amber-600 dark:hover:text-amber-400 font-medium text-lg transition-colors py-2 border-b border-amber-100 dark:border-gray-700'
                >
                  {t('nav.recipes')}
                </Link>
                <Link
                  onClick={() => setIsShowNav(false)}
                  href={PAGES.SOCIAL}
                  className='text-gray-700 dark:text-gray-200 hover:text-amber-600 dark:hover:text-amber-400 font-medium text-lg transition-colors py-2 border-b border-amber-100 dark:border-gray-700'
                >
                  {t('nav.socialMedia')}
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    href={PAGES.ADMIN_PANEL}
                    onClick={() => setIsShowNav(false)}
                    className='text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium text-lg transition-colors py-2 border-b border-amber-100 dark:border-gray-700'
                  >
                    {t('nav.adminPanel')}
                  </Link>
                )}

                <div className='pt-2'>
                  {user ? (
                    <div className='flex flex-col items-start'>
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
                            <GiCook className='text-lg'/>
                          </div>
                        )}

                        <span className='text-lg text-gray-700 dark:text-gray-200 font-medium lg:block'>{user.name !== '' ? user.name : user.email}</span>
                      </div>
                      <div className='text-xl mt-3'>
                        <Link
                          href={PAGES.PROFILE(user.name)}
                          className=' pt-2 text-gray-700 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors'
                        >
                          {t('auth.profile')}
                        </Link>
                        <button
                          className='w-full text-left pt-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
                          onClick={handleLogout}
                        >
                          {t('auth.logout')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsOpenAuthPage(true)}
                      className='px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-full transition-all shadow-md hover:shadow-lg'
                    >
                      {t('auth.login')}
                    </button>
                  )}
                </div>

                <div className='flex items-center justify-center w-full mt-2'>
                  <LanguageSwitcher/>
                </div>
              </nav>

              <button
                className='absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-amber-100 dark:bg-gray-700 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-gray-600 transition-colors'
                onClick={() => setIsShowNav(false)}
              >
                <IoClose className='text-xl'/>
              </button>

            </div>
          </div>
        )}
      </>
  );
};

export default NavMenuMobile;