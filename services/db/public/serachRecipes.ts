import {supabase} from "@/lib/supabase/ClientComponentClient";

const searchRecipes = async (word: string) => {
  const {data, error} = await supabase
    .from('recipes')
    .select('*')
    .
}