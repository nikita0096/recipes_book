import HomePage from "@/components/home/HomePage";
import {fetchAuthorInfo} from "@/services/db/author/fetchAuthorInfo";
import {supabase} from "@/lib/supabase/ClientComponentClient";

export default async function Home() {
  const recipeId = await fetchAuthorInfo().then(res => res.data.heroCakeId);

  const {data} = await supabase
    .from('recipes')
    .select('title, preparing_time, steps_count, slug')
    .eq('id', recipeId)
    .maybeSingle();

  const cakeAssemblyData = {
    ...data,
    id: recipeId,
  };

  let animatedWordsList = null;

  const {data: words, error} = await supabase.from('author').select('animated_hero_words');

  if(!error) animatedWordsList = words[0].animated_hero_words;

  return (
    <HomePage cakeAssemblyData={cakeAssemblyData} animatedWordsList={animatedWordsList}/>
  )
}
