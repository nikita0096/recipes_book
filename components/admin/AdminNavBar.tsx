'use client';

import React from 'react';
import {Link, usePathname} from "@/i18n/navigation";
import {useTranslations} from "next-intl";

const AdminNavBar = () => {
  const pathname = usePathname();
  const t = useTranslations('admin');

  const tabs = [
    { href: '/admin', label: t('nav.addNewRecipe') },
    { href: '/admin/recipes', label: t('nav.allRecipes') },
  ];

  return (
    <div className="flex gap-0 px-6 sm:px-10 py-5 border-b border-border">
      {tabs.map((tab, i) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            className={`text-xs tracking-[0.06em] uppercase py-2 px-4 sm:px-5 border border-border transition-colors
                       ${i > 0 ? 'border-l-0' : ''}
                       ${isActive
                         ? 'bg-text text-bg'
                         : 'bg-transparent text-muted hover:bg-surface'
                       }`}
            href={tab.href}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
};

export default AdminNavBar;
