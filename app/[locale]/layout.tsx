import {NextIntlClientProvider} from "next-intl";
import {getMessages, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {Quicksand} from "next/font/google";
import {routing} from "@/i18n/routing";
import Header from "@/components/header/Header";
import Providers from "@/components/providers/Providers";
import "../globals.css";
import {createClient} from "@/lib/supabase/ServerComponentClient";
import {UserRole} from "@/store/useUserStore";

const quicksand = Quicksand({
  subsets: ["latin", "latin-ext"],
  weight: ['500'],
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
      .from("users")
      .select("role")
      .eq('id', user.id)
      .single();

    initUser = {
      id: user.id,
      name: user.user_metadata.name,
      avatar_url: user.user_metadata.avatar_url,
      role: profile?.role || 'user',
      email: user.user_metadata.email,
    }
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${quicksand.className} antialiased`}>
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