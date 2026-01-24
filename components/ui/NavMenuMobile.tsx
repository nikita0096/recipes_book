import React from 'react';
import Link from "next/link";
import {PAGES} from "@/config/page.config";
import {IUserState} from "@/store/useUserStore";
import {IoClose} from "react-icons/io5";
import AuthBar from "@/components/authorization/AuthBar";

interface NavMenuMobileProps {
  user: IUserState | null;
  isShowNav: boolean;
  setIsShowNav: (value: boolean) => void;
  handleLogin: () => void;
  handleLogout: () => void;
}

const NavMenuMobile: React.FC<NavMenuMobileProps> = ({user, isShowNav, setIsShowNav, handleLogin, handleLogout}) => {
  return (
    <div>
      {isShowNav &&
        <div className='absolute top-11 left-0 w-full h-auto bg-pink-100 dark:bg-gray-700 z-50'>
          <nav className='flex flex-col items-start justify-between h-1/2 p-15 xl:text-3xl md:text-2xl gap-4 sm:text-sm'>
            <Link onClick={() => setIsShowNav(!isShowNav)}
                  href={PAGES.HOME}>Home</Link>
            <Link onClick={() => setIsShowNav(!isShowNav)}
                  href={PAGES.RECIPES}>Recipes</Link>
            <Link onClick={() => setIsShowNav(!isShowNav)}
                  href={PAGES.SOCIAL}>Social media</Link>
            {user?.role === 'admin' && <Link href={PAGES.ADMIN_PANEL}
                                 onClick={() => setIsShowNav(!isShowNav)}>Admin panel</Link>}

            <div className='w-full'>
              <AuthBar user={user}
                       handleLogin={handleLogin}
                       handleLogout={handleLogout}/>
            </div>
          </nav>

          <IoClose className='absolute top-15 right-15 text-4xl'
                   onClick={() => setIsShowNav(!isShowNav)}/>
        </div>}
    </div>
  );
};

export default NavMenuMobile;