import React from 'react';
import type {Metadata} from "next";
import {createClient} from "@/lib/supabase/ServerComponentClient";

type Props = {
  params: { recipe: string, locale: string };
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const supabase = await createClient();

  const {locale, recipe} = await params;

  const {data} = await supabase
    .from('recipes')
    .select('title')
    .eq('id', recipe)
    .single();

  return {
    title: data?.title[locale] || 'Recipe',
  };
}


interface RecipeLayoutProps {
  children: React.ReactNode;
  params: { recipe: string, locale: string };
}

export default async function RecipeLayout({children, params}: RecipeLayoutProps) {
  const {locale, recipe} = await params;
  const supabase = await createClient();

  const {data: {user}} = await supabase.auth.getUser();

  // const {data} = await supabase
  //   .from('profiles')
  //   .select('role')
  //   .eq('id', user?.id)
  //   .single();

  const {data} = await supabase
    .from('recipes')
    .select('*')
    .eq('id', recipe)
    .single();

    return (
      <div>
        {children}
      </div>
    );
}
