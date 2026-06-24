import type {Metadata} from "next";
import {DM_Sans, DM_Serif_Display, Cormorant_Garamond} from "next/font/google";
import {getLocale} from "next-intl/server";
import Providers from "@/components/providers/Providers";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin", "latin-ext"],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
  display: 'swap',
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
});

export const metadata: Metadata = {
  title: "CookBook by YS",
  description: "Personal Recipes Book by YS",
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${dmSans.variable} ${dmSerifDisplay.variable} ${cormorantGaramond.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
