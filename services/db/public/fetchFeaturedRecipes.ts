import { supabase } from "@/lib/supabase/ClientComponentClient";
import {getPublicImageUrl} from "@/services/storage/getPublicImageUrl";
import {LocalizedText} from "@/types";

export interface FeaturedRecipe {
  id: string;
  slug: string;
  title: LocalizedText;
  heroImg: string;
  stepsCount: number;
  isPremium: boolean;
  likes: number;
  category: LocalizedText;
  description: LocalizedText;
  preparingTime: number;
}

export const fetchFeaturedRecipes = async (): Promise<FeaturedRecipe[] | []> => {
  const { data, error } = await supabase
    .from("recipes")
    .select('*')
    .order("likes", { ascending: false })
    .limit(3);

  if (error) throw error;

  const result = data.map((recipe) => {
    if(recipe.hero_img) {
      const heroUrl = getPublicImageUrl(recipe.hero_img, 'hero-images');

      return {
        ...recipe,
        hero_img: heroUrl,
      }
    }
    return recipe;
  });

  if(!result.length)  return [];

  return (result || []).map((item) => {
    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      heroImg: item.hero_img || '',
      stepsCount: item.steps_count,
      isPremium: item.is_premium,
      likes: item.likes,
      category: item.category,
      description: item.description,
      preparingTime: item.preparing_time
    }
  });
};
