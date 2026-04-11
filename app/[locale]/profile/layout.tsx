import {createClient} from "@/lib/supabase/ServerComponentClient";
import {redirect} from "next/navigation";

interface HomeLayoutProps {
  children: React.ReactNode;
}

export default async function ProfileLayout({ children }: HomeLayoutProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/');

  return (
    <div>
      {children}
    </div>
  );
}
