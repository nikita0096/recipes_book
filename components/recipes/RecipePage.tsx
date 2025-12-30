import React from 'react';
import Image from "next/image";
import {IRecipe} from "@/app/recipes/page";

interface RecipePageProps {
  recipe: IRecipe;
}

const RecipePage: React.FC<RecipePageProps> = ({recipe}) => {
  console.log(recipe);
  return (
    <div id="default-carousel"
         className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-0"
         data-carousel="slide">
      <h2 className='text-center text-5xl my-5'>{recipe.title}</h2>
      <div className="relative h-56 overflow-hidden rounded-base md:h-120">
        <div
          className="duration-700 ease-in-out"
          data-carousel-item>
          <Image
            src={recipe.recipeSteps[0].imgUrl}
            className="-translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 w-1/2 aspect-square"
            alt={recipe.title}
            width={100}
            height={100}
            priority
          />
        </div>
      </div>
      <h5 className='text-2xl'>Ingredients:</h5>
      <div className='flex items-center justify-start gap-2 flex-wrap my-2 w-1/2'>
        {recipe.ingredients.map((item, i) => (
          <div className='flex flex-row items-center justify-between gap-2 px-2 py-1 rounded bg-gray-700 dark:bg-pink-100 text-white dark:text-black'
               key={i}>
            <p>{item}</p>
          </div>))}
      </div>

      <h5 className='text-2xl'>Steps:</h5>

      <div>
        {recipe.recipeSteps.map((item, i) => (
          <ul  key={i}>
            <li>
              {item.imgUrl && (
                <Image
                  className='rounded-xl aspect-auto w-1/3'
                  width={300}
                  height={300}
                  src={item.imgUrl}
                  alt='Uploaded image'
                />
              )}
              <p>{item.desc}</p>
            </li>
          </ul>
        ))}
      </div>
    </div>
  );
};

export default RecipePage;