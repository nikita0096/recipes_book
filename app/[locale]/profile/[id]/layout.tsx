import type {Metadata} from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Account page",
};

interface HomeLayoutProps {
  children: React.ReactNode;
  params: Promise<{locale: string, id: string}>
}

export default async function ProfilePageLayout({ children, params}: HomeLayoutProps) {
  return (
    <div>
      {children}
    </div>
  );
}
