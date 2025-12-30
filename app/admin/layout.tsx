import {PropsWithChildren} from "react";
import AdminNavBar from "@/app/admin/AdminNavBar";
import {createClient} from "@/supabase/ServerComponentClient";
import {redirect} from "next/navigation";
import {supabase} from "@/supabase/ClientComponentClient";

export default async function AdminLayout({children}: PropsWithChildren<unknown>) {
  const supabaseAuth = await createClient();

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  console.log(user)
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();


  // if (profile?.role !== 'admin') redirect('/');

  return (
      <div className="w-5/6 mx-auto mt-3">
        <AdminNavBar/>
        {children}
      </div>
  );
}