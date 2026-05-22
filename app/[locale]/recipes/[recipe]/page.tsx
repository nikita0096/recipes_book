import RecipePage from "@/components/recipes/recipe/RecipePage";
import {createClient} from "@/lib/supabase/ServerComponentClient";

interface PageProps {
  params: Promise<{ recipe: string }>;
}

export default async function Page({params}: PageProps){
  const {recipe: recipeId} = await params;
  const supabase = await createClient();

  const {data: {user}} = await supabase.auth.getUser();

  let isLiked = false;

  if(user){
    const {data} = await supabase
      .from("recipe_likes")
      .select("id")
      .eq('recipe_id', recipeId)
      .eq('user_id', user.id)
      .single();

    isLiked = !!data;
  }

  return (
    <RecipePage
      recipeId={recipeId}
      isLikedRecipe={isLiked}
    />
  );
};