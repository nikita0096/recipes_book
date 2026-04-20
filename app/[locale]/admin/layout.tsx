import {PropsWithChildren} from "react";
import AdminNavBar from "@/components/admin/AdminNavBar";
import {createClient} from "@/lib/supabase/ServerComponentClient";
import {redirect} from "next/navigation";
import type {Metadata} from "next";

export const metadata: Metadata = {
  title: "Recipes admin",
  description: "Recipes list",
};

export default async function AdminLayout({children}: PropsWithChildren<unknown>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();


  if (!profile || profile?.role !== 'admin') redirect('/');

  return (
      <div>
        <AdminNavBar/>
        {children}
      </div>
  );
}