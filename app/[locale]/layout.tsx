import {NextIntlClientProvider} from "next-intl";
import {getMessages, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {DM_Sans, DM_Serif_Display} from "next/font/google";
import {routing} from "@/i18n/routing";
import Header from "@/components/header/Header";
import Providers from "@/components/providers/Providers";
import "../globals.css";
import {createClient} from "@/lib/supabase/ServerComponentClient";
import {cookies} from "next/headers";
import type {Metadata} from "next";

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

  const supabase = await createClient();

  const {data: {user}} = await supabase.auth.getUser();

  let initUser = null;
  if (user) {
    const {data: profile} = await supabase
      .from("profiles")
      .select("role, name")
      .eq('id', user.id)
      .single();

    initUser = {
      id: user.id,
      name: user.user_metadata.name === profile?.name ? user.user_metadata.name : profile?.name,
      avatar_url: user.user_metadata.avatar_url,
      role: profile?.role || 'user',
      email: user.user_metadata.email,
      createdAt: user.created_at,
    }
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${dmSans.variable} ${dmSerifDisplay.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Header initUser={initUser}/>
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