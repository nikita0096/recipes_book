'use client';

import React from 'react';
import Link from "next/link";
import {usePathname} from "next/navigation";

const AdminNavBar = () => {
  const pathname = usePathname();

  const linkBaseClass = 'px-6 py-2.5 rounded-full font-medium transition-all duration-300';
  const activeClass = 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md';
  const inactiveClass = 'bg-amber-100 dark:bg-gray-700 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-gray-600';

  return (
    <div className="flex flex-wrap justify-center gap-3 py-4">
      <Link
        className={`${linkBaseClass} ${pathname === '/admin' ? activeClass : inactiveClass}`}
        href='/admin'
      >
        Add new recipe
      </Link>
      <Link
        className={`${linkBaseClass} ${pathname === '/admin/recipes' ? activeClass : inactiveClass}`}
        href='/admin/recipes'
      >
        All recipes
      </Link>
    </div>
  );
};

export default AdminNavBar;