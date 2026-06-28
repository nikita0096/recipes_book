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

  //parallel recipe and likes fetching, to save a round-trip
  // makes the hero/imgs available on the first render

  const [likeResult, {data: recipe, totalPrice, error}] = await Promise.all([
    user
      ? supabase
        .from("recipe_likes")
        .select("id")
        .eq('recipe_id', recipeId)
        .eq('user_id', user.id)
        .single()
      : Promise.resolve({data: null}),
    fetchRecipeServer(supabase, recipeId)
  ]);

  return (
    <RecipePage
      recipeId={recipeId}
      isLikedRecipe={!!likeResult.data}
      initialRecipe={recipe}
      initialPrice={totalPrice}
      initialError={error ? error.message : null}
    />
  );
};