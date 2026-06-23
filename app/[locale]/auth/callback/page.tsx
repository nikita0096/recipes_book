'use client';

import { useEffect } from 'react'
import {useRouter} from "@/i18n/navigation";
import {supabase} from "@/lib/supabase/ClientComponentClient";
import {useParams, useSearchParams} from "next/navigation";
import LoadingPage from "@/components/ui/LoadingPage";
import {useUserStore} from "@/store/useUserStore";

export default function Page() {
  const {setUserData} = useUserStore();

  const router = useRouter();
  const params = useParams();

  const searchParams = useSearchParams();
  const pathname = searchParams.get('next') || '/';

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error(error);
        router.push('/')
        return
      }

      if (data.session?.user) {
        setUserData({
          id:  data.session.user.id,
          name: data.session.user.user_metadata?.name,
          avatar_url: data.session.user.user_metadata?.avatar_url || null,
          role: 'user',
          email: data.session.user.email || '',
          createdAt: data.session.user.created_at,
        });
      }

      router.replace(window.location.origin + pathname)
    }

    handleAuth()
  }, [params, router, pathname])

  return <LoadingPage/>
}