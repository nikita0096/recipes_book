import {redirect} from 'next/navigation';
import {createClient} from "@/lib/supabase/ServerComponentClient";
import ProfileContent, {LikedRecipe, PurchasedRecipe} from '@/components/profile/ProfileContent'
import {LocalizedText} from "@/types";
import {getPublicImageUrl} from "@/services/storage/getPublicImageUrl";
import {RECIPE_PLACEHOLDER_IMAGE} from "@/constants/images";

interface PreviewLikedRecipeData {
  id: string;
  hero_img: string;
  title: LocalizedText;
}

interface PreviewPurchasedRecipeData {
  id: string;
  hero_img: string;
  title: LocalizedText;
}

interface UserLikesData {
  id: string;
  recipe: PreviewLikedRecipeData;
}

interface UserPurchasedData {
  id: string;
  purchased_at: string
  recipe_premium: {
    recipe: PreviewPurchasedRecipeData;
  }
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {data: {user}} = await
    supabase.auth.getUser();


  if (!user) {
    redirect('/');
  }

  let likedRecipesData: LikedRecipe[] | null = null;

  const {data: likedRecipes} = await supabase
    .from('recipe_likes')
    .select('id, recipe: recipe_id (id, hero_img, title)')
    .eq('user_id', user.id) as unknown as { data: UserLikesData[] | null }

  if (likedRecipes) likedRecipesData = likedRecipes.map(like => {
    const imgUrl = getPublicImageUrl(like.recipe.hero_img, 'hero-images');
    return {
      id: like.id,
      recipe: {
        id: like.recipe.id,
        heroImg: imgUrl || RECIPE_PLACEHOLDER_IMAGE,
        title: like.recipe.title
      }
    }
  });

  let purchasedRecipesData: PurchasedRecipe[] = [];

  const {data: purchases} = await supabase
    .from('purchases')
    .select(`
      id,
      purchased_at,
      recipe_premium:premium_recipe_id (
        recipe:recipe_id (id, hero_img, title)
      )
    `)
    .eq('user_id', user.id) as unknown as { data: UserPurchasedData[] | null };4

  if (purchases) {
    purchasedRecipesData = purchases.map(purchase => {
        const imgUrl = getPublicImageUrl(purchase.recipe_premium.recipe.hero_img, 'hero-images');

        return {
          id: purchase.id,
          purchasedAt: purchase.purchased_at,
          recipe: {
            id: purchase.recipe_premium.recipe.id,
            heroImg: imgUrl || RECIPE_PLACEHOLDER_IMAGE,
            title: purchase.recipe_premium.recipe.title
          }
        }
      }
    );
  }


  return (
    <ProfileContent
      likedRecipesData={likedRecipesData || []}
      purchasedRecipesData={purchasedRecipesData || []}
    />
  );
}