import type {Metadata} from "next";

export const metadata: Metadata = {
  title: "Recipes Book by YS",
  description: "Personal Recipes Book by YS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
