import React from 'react';
import type {Metadata} from "next";
import {createClient} from "@/lib/supabase/ServerComponentClient";

type Props = {
  params: Promise<{ slug: string, locale: string }>;
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const supabase = await createClient();

  const {locale, slug} = await params;

  const id = slug.split('-').pop();

  const {data} = await supabase
    .from('recipes')
    .select('title')
    .eq('id', id)
    .single();

  return {
    title: data?.title[locale] || 'Recipe',
  };
}


interface RecipeLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string, locale: string }>;
}

export default async function RecipeLayout({children, params}: RecipeLayoutProps) {
    return (
      <div>
        {children}
      </div>
    );
}
