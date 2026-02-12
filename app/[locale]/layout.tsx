import {NextIntlClientProvider} from "next-intl";
import {getMessages, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {Quicksand} from "next/font/google";
import {routing} from "@/i18n/routing";
import Header from "@/components/header/Header";
import Providers from "@/components/providers/Providers";
import "../globals.css";

const quicksand = Quicksand({
  subsets: ["latin", "latin-ext"],
  weight: ['500'],
});

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({children, params}: LocaleLayoutProps) {
  const {locale} = await params;

  if (!routing.locales.includes(locale as "en" | "uk")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${quicksand.className} antialiased transition-all duration-500`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Header />
            <main>{children}</main>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}