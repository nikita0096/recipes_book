import React from 'react';
import Link from "next/link";

const AdminNavBar = () => {
  return (
    <div className="flex flex-wrap justify-center space-x-5">
      <Link className='bg-black dark:bg-white text-white dark:text-black rounded-xl px-4 py-2' href='/admin'>Add new recipe</Link>
      <Link className='bg-black dark:bg-white text-white dark:text-black rounded-xl px-4 py-2' href='/admin/recipes'>All recipes</Link>
    </div>
  );
};

export default AdminNavBar;