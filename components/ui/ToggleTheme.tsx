'use client';

import {useTheme} from "next-themes";

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
);

const ToggleTheme = () => {
  const {setTheme, resolvedTheme} = useTheme();

  return (
    <button
      className="w-14 h-7 border border-border bg-surface relative flex items-center px-1.5 justify-between shrink-0 cursor-pointer transition-colors"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      <span className="text-accent"><SunIcon /></span>
      <span className="text-muted"><MoonIcon /></span>
      <div className="absolute w-5 h-5  bg-accent transition-all duration-200 left-1 dark:left-[30px]" />
    </button>
  );
};

export default ToggleTheme;
