import {setRequestLocale} from "next-intl/server";

interface LegalLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LegalLayout({children, params}: LegalLayoutProps) {
  const {locale} = await params;
  setRequestLocale(locale);

  return (
    <section className="min-h-screen bg-bg">
      {children}
    </section>
  );
}