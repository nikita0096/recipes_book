'use client';

import React, {useState} from 'react';
import {IRecipe} from "@/types/recipe";
import {useQueryClient} from "@tanstack/react-query";
import {deleteRecipe} from "@/services/db/admin/deleteRecipe";
import {Link} from "@/i18n/navigation";
import Image from 'next/image';
import {PAGES} from "@/config/page.config";
import {useTranslations} from "next-intl";
import {RECIPE_PLACEHOLDER_IMAGE} from "@/constants/images";
import {useTypedLocale} from "@/hooks/useTypedLocale";
import {MdDelete} from "react-icons/md";

interface AdminRecipeItemProps {
  recipe: IRecipe;
  index?: number;
}

const AdminRecipeItem: React.FC<AdminRecipeItemProps> = ({recipe, index = 0}) => {
  const [image, setImage] = useState<string>(recipe.heroImg || RECIPE_PLACEHOLDER_IMAGE);
  const [isDeleting, setIsDeleting] = useState(false);

  const locale = useTypedLocale();
  const t = useTranslations('admin');
  const tRecipes = useTranslations('recipes');

  const queryClient = useQueryClient();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteRecipe({ id: recipe.id, videoKey: recipe.videoUrl });
      if (result.error) {
        console.log('error', result.error);
      }
      await queryClient.invalidateQueries({ queryKey: ['recipes'] });
    } finally {
      setIsDeleting(false);
    }
  };

  const animationDelay = 100;

  return (
    <div
      className="bg-surface overflow-hidden animate-card-fade-in hover:scale-[1.02] transition-all duration-300"
      style={{
        animationDelay: `${animationDelay + (index * 50)}ms`,
      }}
    >
      {/* Image */}
      <Link href={PAGES.ADMIN_RECIPE_PAGE(recipe.id)} className="block relative overflow-hidden">
        <div className='relative w-full aspect-4/3'>
          <Image
            fill
            className="object-cover"
            src={image}
            alt={recipe.title[locale]}
            onError={() => setImage(RECIPE_PLACEHOLDER_IMAGE)}
          />
        </div>

        {/* Premium/Free badge */}
        {recipe.isPremium ? (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-accent text-white text-xs tracking-wider uppercase">
            Premium
          </span>
        ) : (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-green-600/80 text-white text-xs tracking-wider uppercase">
            {tRecipes('card.free')}
          </span>
        )}

        {/* Delete button overlay */}
        <button
          className='absolute bottom-3 right-3 p-2.5 bg-red-500/90 hover:bg-red-600 text-white transition-colors z-10 disabled:opacity-50'
          disabled={isDeleting}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDelete();
          }}
        >
          <MdDelete className="text-lg" />
        </button>
      </Link>

      {/* Content */}
      <div className="p-4 md:p-5">
        {/* Category */}
        <span className="block text-xs tracking-widest uppercase text-accent mb-2">
          {recipe.category[locale]}
        </span>

        {/* Title */}
        <h5 className="font-serif text-lg lg:text-xl text-text leading-tight mb-3 line-clamp-2">
          {recipe.title[locale]}
        </h5>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Likes */}
          <span className="text-sm text-muted">
            ♡ {recipe.likes}
          </span>

          {/* Edit Recipe Button */}
          <Link
            href={PAGES.ADMIN_RECIPE_PAGE(recipe.id)}
            className="text-sm border border-border text-text px-4 py-2 hover:bg-bg transition-colors"
          >
            {t('list.edit')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AdminRecipeItem);
