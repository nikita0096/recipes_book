import {getRequestConfig} from "next-intl/server";
import {routing} from "./routing";

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale = requested && routing.locales.includes(requested as "en" | "ua")
    ? requested
    : routing.defaultLocale;

  const common = (await import(`../messages/${locale}/common.json`)).default;
  const home = (await import(`../messages/${locale}/home.json`)).default;
  const recipes = (await import(`../messages/${locale}/recipes.json`)).default;
  const admin = (await import(`../messages/${locale}/admin.json`)).default;
  const socialMedia = (await import(`../messages/${locale}/socialMedia.json`)).default;

  return {
    locale,
    messages: {
      common,
      home,
      recipes,
      admin,
      socialMedia
    }
  };
});