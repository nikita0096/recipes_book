'use client';

import {FaMoon, FaSun} from "react-icons/fa";
import {useTheme} from "next-themes";

const ToggleTheme = () => {
  const {theme, setTheme} = useTheme();

  return (
    <button
      className='w-9 h-9 rounded-full flex items-center justify-center bg-amber-100 dark:bg-gray-700 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-gray-600 transition-colors shadow-sm'
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <FaSun className='h-4 w-4 block dark:hidden' />
      <FaMoon className='h-4 w-4 hidden dark:block' />
    </button>
  );
};

export default ToggleTheme;