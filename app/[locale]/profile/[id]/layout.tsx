import React from 'react';
import {createClient} from "@/lib/supabase/ServerComponentClient";
import {supabase} from "@/lib/supabase/ClientComponentClient";

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
