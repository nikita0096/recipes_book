import {NextIntlClientProvider} from "next-intl";
import {getMessages, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {DM_Sans, DM_Serif_Display} from "next/font/google";
import {routing} from "@/i18n/routing";
import Header from "@/components/header/Header";
import Providers from "@/components/providers/Providers";
import "../globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
});


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

  if (!routing.locales.includes(locale as "en" | "ua")) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${dmSans.variable} ${dmSerifDisplay.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Header/>
            <main>
              {children}
              {modal}
            </main>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}