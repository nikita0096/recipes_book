import {supabase} from "@/lib/supabase/ClientComponentClient";

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

export const getUserProfile = async (userId: string) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return profile;
}