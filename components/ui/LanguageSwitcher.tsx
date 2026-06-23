'use client';

import {useLocale} from 'next-intl';
import {Link, usePathname} from '@/i18n/navigation';

const LanguageSwitcher = () => {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex border border-border overflow-hidden">
      <Link
        href={pathname}
        locale="en"
        className={`text-xs font-medium px-2.5 py-1.5 tracking-wide transition-all ${
          locale === 'en'
            ? 'bg-accent text-white'
            : 'text-muted hover:text-text hover:bg-surface'
        }`}
      >
        EN
      </Link>
      <Link
        href={pathname}
        locale="uk"
        className={`text-xs font-medium px-2.5 py-1.5 tracking-wide border-l border-border transition-all ${
          locale === 'uk'
            ? 'bg-accent text-white'
            : 'text-muted hover:text-text hover:bg-surface'
        }`}
      >
        UA
      </Link>
    </div>
  );
};

export default LanguageSwitcher;
