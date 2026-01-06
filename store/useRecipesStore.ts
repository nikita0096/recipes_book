import {create} from "zustand/react";
import {IRecipe} from "@/app/recipes/page";
import {supabase} from "@/lib/supabase/ClientComponentClient";

interface RecipesState {
  recipes: IRecipe[];
  selectedRecipe: IRecipe | null;
  isLoading: boolean;
  error: string | null;
  getRecipes: () => void,
  setSelectedRecipe: (id: string) => void;
}

export const useRecipesStore = create<RecipesState>((set) => ({
  recipes: [],
  selectedRecipe: null,
  isLoading: false,
  error: null,
  getRecipes: async () => {
    set({
      isLoading: true,
      error: null,
    });

    const {data, error} = await supabase
      .from('recipes')
      .select();

    if(error) {
      set({
        isLoading: false,
        error: 'Something went wrong, please try again later',
        recipes: []
      });
      return;
    }

    set({
      isLoading: false,
      error: null,
      recipes: data ?? []
    })
  },
  setSelectedRecipe: async (id) => {
    const {data, error} = await supabase
      .from('recipes')
      .select()
      .eq('id', Number(id))
      .single();

    if(error) {
      set({
        isLoading: false,
        error: 'Something went wrong, please try again later',
        selectedRecipe: null,
      });
      return;
    }

    set({
      isLoading: false,
      error: null,
      selectedRecipe: data,
    });
  },

}));
