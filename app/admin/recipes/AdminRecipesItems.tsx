'use client';

import React from 'react';
import {useQuery} from "@tanstack/react-query";
import AdminRecipeItem from "@/app/admin/recipes/AdminRecipeItem";
import {fetchRecipes} from "@/services/db/fetchRecipes";
import LoadingPage from "@/components/ui/LoadingPage";

const AdminRecipesItems = () => {

  const {data, error, isLoading} = useQuery({
    queryKey: ['recipes'],
    queryFn: fetchRecipes,
  });

  if(error) return (
    <div>
      Error
    </div>
  );

  if (isLoading) {
    return <LoadingPage/>;
  }

  return (
    <div className='mt-4'>
      <div className='flex flex-col gap-3 w-full'>
        {data?.map((recipe) => (<AdminRecipeItem key={recipe.id} recipe={recipe} />))}
      </div>
    </div>
  );
};

export default AdminRecipesItems;