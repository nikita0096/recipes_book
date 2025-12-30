'use client';

import React, {useState} from 'react';
import {IRecipe} from "@/app/recipes/page";
import Image from 'next/image';
import {PAGES} from "@/config/page.config";
import Link from "next/link";
import {useRecipesStore} from "@/store/useRecipesStore";

interface RecipeItemProps {
  recipe: IRecipe;
}

const imagePlaceholder = "https://media.istockphoto.com/id/1346523346/vector/spoon-and-fork-icon-vector-illustration-design-editable-resizable-eps-10.jpg?s=612x612&w=0&k=20&c=OOAsa1DeluipbQkMVlGsK98eHFjGzz0fMmyyry4pvpA=";

const RecipeItem: React.FC<RecipeItemProps> = ({recipe}) => {
  const [image, setImage] = useState<string>(recipe.recipeSteps[0].imgUrl);

  return (
    <div className="flex flex-row border rounded-base shadow-xs rounded-xl overflow-hidden w-full">
      <Link href={PAGES.RECIPE(recipe.id)} className="w-1/2">
        <Image
          width={100}
          height={100}
          className="rounded-t-base w-full h-full aspect-3/2 object-cover"
          src={image}
          alt={recipe.title}
          onError={() => setImage(imagePlaceholder)}
        />
      </Link>

      <div className="flex flex-col items-center justify-center p-6 text-center w-1/2">
        <span className="inline-flex items-center bg-brand-softer border border-brand-subtle text-fg-brand-strong text-xs font-medium px-1.5 py-0.5 rounded-sm"
          style={recipe.likes >= 10 ? {color: 'red'} : {}}
        >
      <svg
        className="w-3 h-3 me-1"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M18.122 17.645a7.185 7.185 0 0 1-2.656 2.495 7.06 7.06 0 0 1-3.52.853 6.617 6.617 0 0 1-3.306-.718 6.73 6.73 0 0 1-2.54-2.266c-2.672-4.57.287-8.846.887-9.668A4.448 4.448 0 0 0 8.07 6.31 4.49 4.49 0 0 0 7.997 4c1.284.965 6.43 3.258 5.525 10.631 1.496-1.136 2.7-3.046 2.846-6.216 1.43 1.061 3.985 5.462 1.754 9.23Z"
        />
      </svg>
      Trending
    </span>

        <a href="#">
          <h5 className="mt-3 text-2xl font-semibold tracking-tight text-heading">
            {recipe.title}
          </h5>
        </a>
        <p className='mb-4 text-xs text-gray-400'>{recipe.category}</p>

        <a
          href="#"
          className="inline-flex items-center text-white bg-blue-400 box-border border border-transparent rounded-xl hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none hover:-rotate-2 hover:scale-95 hover:-translate-0.5 transition"
        >
          Read more
        </a>
      </div>
    </div>
  );
};

export default RecipeItem;