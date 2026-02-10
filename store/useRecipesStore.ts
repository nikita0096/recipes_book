import {create} from "zustand/react";
import {IRecipe} from "@/app/recipes/page";
import {supabase} from "@/lib/supabase/ClientComponentClient";

interface RecipesState {
  recipes: IRecipe[];
  selectedRecipe: IRecipe | null;
  isLoading: boolean;
  error: string | null;
  getRecipes: (page: number, pageSize: number) => void,
  setSelectedRecipe: (id: string | null) => void;
}

export const useRecipesStore = create<RecipesState>((set, get) => ({
  recipes: [],
  selectedRecipe: null,
  isLoading: false,
  error: null,
  getRecipes: async (page = 0, pageSize = 10) => {
    set({
      isLoading: true,
      error: null,
    });

    const start = page * pageSize;
    const end = start + pageSize - 1;

    const {data, error} = await supabase
      .from('recipes')
      .select()
      .range(start, end);

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
      recipes: data ? [...get().recipes, ...data] : [],
    })
  },
  setSelectedRecipe: async (id) => {
    if (id === null) {
      set({
        selectedRecipe: null,
      });
      return;
    }

    set({
      isLoading: true,
      error: null,
    });

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
