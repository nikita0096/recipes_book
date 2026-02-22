'use client';

import {useLocale} from 'next-intl';
import {Link, usePathname} from '@/i18n/navigation';

const LanguageSwitcher = () => {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 bg-amber-100 dark:bg-gray-700 rounded-full p-1">
      <Link
        href={pathname}
        locale="en"
        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
          locale === 'en'
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
            : 'text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400'
        }`}
      >
        EN
      </Link>
      <Link
        href={pathname}
        locale="ua"
        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
          locale === 'ua'
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
            : 'text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400'
        }`}
      >
        UA
      </Link>
    </div>
  );
};

export default LanguageSwitcher;
