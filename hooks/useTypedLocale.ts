import {useLocale} from "next-intl";

type Locale = 'en' | 'ua';

export const useTypedLocale = () => {
  return useLocale() as Locale;
}