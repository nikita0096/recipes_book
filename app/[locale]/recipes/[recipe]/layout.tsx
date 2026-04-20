import React from 'react';
import type {Metadata} from "next";
import {createClient} from "@/lib/supabase/ServerComponentClient";

type Props = {
  params: {recipe: string, locale: string};
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
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
}

export default function RecipeLayout({ children }: RecipeLayoutProps) {
  return (
    <div>
      {children}
    </div>
  );
}
