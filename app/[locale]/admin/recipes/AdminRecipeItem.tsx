'use client';

import React, {useState} from 'react';
import {IRecipe, parseJson} from "@/types/recipe";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {deleteRecipe} from "@/services/db/deleteRecipe";
import {Link} from "@/i18n/navigation";
import Image from 'next/image';
import {PAGES} from "@/config/page.config";
import {useTranslations} from "next-intl";
import {RECIPE_PLACEHOLDER_IMAGE} from "@/constants/images";
import {useTypedLocale} from "@/hooks/useTypedLocale";
import {MdDelete} from "react-icons/md";

interface AdminRecipeItemProps {
  recipe: IRecipe;
}

const AdminRecipeItem: React.FC<AdminRecipeItemProps> = ({recipe}) => {
  const [image, setImage] = useState<string>(recipe.recipeSteps[0]?.imgUrl || RECIPE_PLACEHOLDER_IMAGE);
  const locale = useTypedLocale();
  const t = useTranslations('admin');
  const tRecipes = useTranslations('recipes');

  const title = parseJson(recipe.title);

  const queryClient = useQueryClient();

  const deleteRecipeMutation = useMutation({
    mutationFn: deleteRecipe,

    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ['recipes']});
    },
  });

  return (
    <div className='relative'>
      <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl overflow-hidden transition-all duration-300 hover:scale-[1.02]">
        <Link href={PAGES.ADMIN_RECIPE_PAGE(recipe.id)} className="block relative h-48 overflow-hidden">
          <Image
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            src={image}
            alt={title[locale]}
            onError={() => setImage(RECIPE_PLACEHOLDER_IMAGE)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {recipe.likes >= 10 && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-medium shadow-md">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" />
            </svg>
            {tRecipes('card.hot')}
          </span>
          )}
        </Link>

        <div className="p-5">
        <span className="inline-block px-3 py-1 mb-3 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 rounded-full">
          {recipe.category}
        </span>

          <h5 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">
            {title[locale]}
          </h5>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
              <span className="text-sm">{recipe.likes}</span>
            </div>

            <Link
              href={PAGES.ADMIN_RECIPE_PAGE(recipe.id)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-medium rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
            >
              {t('list.viewRecipe')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
      <div className='absolute top-3 right-3 flex flex-col gap-2'>
        <button
          className='p-4 bg-red-500 hover:bg-red-300 rounded-xl transition-colors shadow-md'
          onClick={() => deleteRecipeMutation.mutate(recipe.id.toString())}
        >
          <MdDelete />
        </button>
      </div>
    </div>
  );
};

export default AdminRecipeItem;