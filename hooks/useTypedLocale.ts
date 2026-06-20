import {useLocale} from "next-intl";

type Locale = 'en' | 'uk';

export const useTypedLocale = () => {
  return useLocale() as Locale;
}