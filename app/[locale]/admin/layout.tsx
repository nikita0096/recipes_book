import {PropsWithChildren} from "react";
import AdminNavBar from "./AdminNavBar";
import {createClient} from "@/lib/supabase/ServerComponentClient";
import {redirect} from "next/navigation";

export default async function AdminLayout({children}: PropsWithChildren<unknown>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();


  if (!profile || profile?.role !== 'admin') redirect('/');

  return (
      <div className="w-5/6 mx-auto mt-3">
        <AdminNavBar/>
        {children}
      </div>
  );
}