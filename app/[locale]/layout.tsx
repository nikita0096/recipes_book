import {NextIntlClientProvider} from "next-intl";
import {getMessages, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {routing} from "@/i18n/routing";
import Header from "@/components/header/Header";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
  modal: React.ReactNode;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({children, params, modal}: LocaleLayoutProps) {
  const {locale} = await params;

  if (!routing.locales.includes(locale as "en" | "uk")) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <Header/>
      <main>
        {children}
        {modal}
      </main>
    </NextIntlClientProvider>
  );
}