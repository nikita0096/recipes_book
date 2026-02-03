'use client';

import {FaMoon, FaSun} from "react-icons/fa";
import {useTheme} from "next-themes";
import {useEffect, useState} from "react";

const ToggleTheme = () => {
  const {theme, resolvedTheme, setTheme} = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted( true);
  },[]);

  if(!mounted) {
    return null;
  }

  let icon;

  switch (resolvedTheme) {
    case 'light':
      icon = <FaSun className='h-4 w-4' />;
      break;
    case 'dark':
      icon = <FaMoon className='h-4 w-4' />;
      break;
    default:
      icon = <FaSun className='h-4 w-4' />;
      break;
  }

  return (
    <button
      className='w-9 h-9 rounded-full flex items-center justify-center bg-amber-100 dark:bg-gray-700 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-gray-600 transition-colors shadow-sm'
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {icon}
    </button>
  );
};

export default ToggleTheme;