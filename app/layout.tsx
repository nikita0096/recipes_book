import type {Metadata} from "next";
import {Geist, Geist_Mono, Quicksand} from "next/font/google";
import "./globals.css";
import Header from "@/components/header/Header";
import Providers from "@/components/providers/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",

  subsets: ["latin"],
});

const quicksand = Quicksand({
  // variable: "--font-quicksand-variable",
  subsets: ["latin"],
  weight: ['500'],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recipes Book by YS",
  description: "Personal Recipes Book by YS",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en"
          suppressHydrationWarning>
    <body
      className={`${quicksand.className} antialiased transition-all duration-500`}
    >
    <main>
      <Providers>
        <Header/>
        {children}
      </Providers>
    </main>
    </body>
    </html>
  );
}
