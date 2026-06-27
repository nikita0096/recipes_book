import RecipePage from "@/components/recipes/recipe/RecipePage";
import {createClient} from "@/lib/supabase/ServerComponentClient";
import {fetchRecipeServer} from "@/services/db/public/fetchRecipeServer";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({params}: PageProps){
  const {slug} = await params;

  const recipeId = slug.split('-').pop() || slug;


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

  // Fetch the recipe on the server so the hero/step images are available on the
  // first render and can be optimized by next/image instead of waiting on a
  // client-side fetch waterfall.
  const {data: recipe, totalPrice, error} = await fetchRecipeServer(supabase, recipeId);

  return (
    <RecipePage
      recipeId={recipeId}
      isLikedRecipe={isLiked}
      initialRecipe={recipe}
      initialPrice={totalPrice}
      initialError={error ? error.message : null}
    />
  );
};