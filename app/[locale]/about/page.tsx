import AuthorPage from "@/components/author/AuthorPage";
import {fetchAuthorInfo} from "@/services/db/author/fetchAuthorInfo";
import {createClient} from "@/lib/supabase/ServerComponentClient";
import {UserState} from "@/store/useUserStore";

const About = async () => {
  const data = await fetchAuthorInfo();

  const authorData = data.data;

  const supabase = await createClient();
  const {data: {user: authUser}} = await supabase.auth.getUser();

  let user: UserState | null = null;

  if (authUser) {
    const {data: profile} = await supabase
      .from('profiles')
      .select('id, name, avatar_url, role, created_at, email')
      .eq('id', authUser.id)
      .single();

    if (profile) {
      user = {
        id: profile.id,
        name: profile.name,
        avatar_url: profile.avatar_url,
        role: profile.role,
        email: profile.email,
        createdAt: profile.created_at,
      };
    }
  }

  return (
    <AuthorPage authorData={authorData} user={user}/>
  )
};

export default About;
