import {useEffect, useState} from "react";
import {supabase} from "@/lib/supabase/ClientComponentClient";
import {IRecipe} from "@/types";
import {toCamelCase} from "@/utils/parseCamelcase";

interface SearchRecipe {
  data: IRecipe[] | [];
  loading: boolean;
}

export function useSearchRecipe(query: string, locale: string): SearchRecipe {
  const [data, setData] = useState<IRecipe[] | []>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setData([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);

      const {data, error} = await supabase
        .from('recipes')
        .select('*')
        .ilike(`title->>${locale}`, `%${query}%`);

      if (!error) setData(data.map(recipe => toCamelCase(recipe)));

      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, locale]);

  return {data, loading};
}