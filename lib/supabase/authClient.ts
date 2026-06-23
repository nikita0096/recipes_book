import {supabase} from "@/lib/supabase/ClientComponentClient";
import {UserState} from "@/store/useUserStore";

export const handleGoogleLogin = async (redirectUrl: string) => {
  const { error} = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl
    }
  });

  if (error) throw error;
};

export const handleEmailLogin = async (email: string, password: string) => {
  const {data, error} = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) throw error;

  const {user} = data;

  return user;
}

export const handleSignUp = async (email: string, password: string, pathname: string) => {
  const locale = window.location.pathname.split('/')[1] || 'en';
  const url = new URL(`${window.location.origin}/${locale}/auth/callback`);
  url.searchParams.set('next', pathname);

  const { data,  error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      emailRedirectTo: url.toString(),
    }
  });

  if (error) throw error;

  return data;
}

export const logout = async () => {
  await supabase.auth.signOut();
};

export const handleResetPassword = async (email: string, pathname: string) => {
  const locale = window.location.pathname.split('/')[1] || 'en';
  const url = new URL(`${window.location.origin}/${locale}/auth/update-password`);
  url.searchParams.set('next', pathname);

  const {error} = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: url.toString(),
  });

  if(error) throw error;
}

export const handleUpdatePassword = async (newPassword: string) => {
  const {data, error} = await supabase.auth.updateUser({
    password: newPassword
  });

  if(error) throw error;

  return data;
}

export const getUser = async () => {
  const {data: {user}} = await supabase.auth.getUser();

  return user;
}

export const getUserProfile = async (userId: string): Promise<UserState | null> => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, role, created_at, email')
    .eq('id', userId)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    name: profile.name,
    avatar_url: profile.avatar_url,
    role: profile.role,
    email: profile.email,
    createdAt: profile.created_at,
  };
}