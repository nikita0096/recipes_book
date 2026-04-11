import {supabase} from "@/lib/supabase/ClientComponentClient";

interface UserProfile {
  name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'user';
  created_at: string;
}

export const handleGoogleLogin = async () => {
  const {data, error} = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback` // куда вернуться после входа
    }
  });

  if (error) console.error(error);

  return data;
};

export const handleEmailLogin = async (email: string, password: string) => {
  const {data, error} = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) throw error;

  return data;
}

export const handleSignUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password
  });

  if (error) console.error(error);
  return data;
}

export const logout = async () => {
  await supabase.auth.signOut();
};

export const getUser = async () => {
  const {data: {user}} = await supabase.auth.getUser();

  return user;
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, avatar_url, role, created_at')
    .eq('id', userId)
    .single();

  return profile as UserProfile | null;
}

export const upsertUserProfile = async (
  userId: string,
  data: { name?: string; avatar_url?: string }
) => {
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      ...data
    }, { onConflict: 'id' });

  if (error) console.error('Error upserting profile:', error);
}