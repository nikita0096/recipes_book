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
      icon = <FaSun className='absolute h-5 w-5'></FaSun>;
      break;
    case 'dark':
      icon = <FaMoon className='absolute h-5 w-5'></FaMoon>
      break;
    default:
      icon = <FaSun className='absolute h-5 w-5'></FaSun>;
      break;
  }

  return (
    <button className='rounded-lg flex items-center justify-center h-7 w-7 border-2'
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {icon}
    </button>
  );
};

export default ToggleTheme;