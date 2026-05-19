import { supabase } from "@/lib/supabase/ClientComponentClient";
import {getSignedImageUrl} from "@/services/storage/getSignedImageUrl";
import {LocalizedText} from "@/types";

interface FeaturedRecipe {
  id: string;
  title: LocalizedText;
  heroImg: string;
  stepsCount: number;
  isPremium: boolean;
  likes: number;
  category: LocalizedText;
  description: LocalizedText;
}

export const fetchFeaturedRecipes = async (): Promise<FeaturedRecipe[] | []> => {
  const { data, error } = await supabase
    .from("recipes")
    .select('*')
    .order("likes", { ascending: false })
    .limit(3);

  if (error) throw error;

  const result = await Promise.all(
    data.map(async (recipe) => {
      if(recipe.hero_img) {
        const heroUrl = await getSignedImageUrl(recipe.hero_img, 'hero-images');

        return {
          ...recipe,
          hero_img: heroUrl,
        }
      }
    })
  );

  if(!result.length)  return [];

  return (result || []).map((item) => {
    return {
      id: item.id,
      title: item.title,
      heroImg: item.hero_img || '',
      stepsCount: item.steps_count,
      isPremium: item.is_premium,
      likes: item.likes,
      category: item.category,
      description: item.description,
    }
  });
};
