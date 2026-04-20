import React from 'react';
import {units} from "@/constants/units";
import {useTypedLocale} from "@/hooks/useTypedLocale";

interface IngredientProps {
  ingredient: {
    value: {en: string, ua: string};
    quantity: string;
    unit: string;
  };
}

const RecipeIngredient: React.FC<IngredientProps> = ({ingredient}) => {
  const locale = useTypedLocale();

  const unit = units.find((unit) => unit.value === ingredient.unit);

  return (
    <div className="relative bg-bg p-3 sm:p-4 flex justify-between items-start gap-3
                    after:content-[''] after:block after:absolute after:top-0 after:right-0 after:w-px after:h-full after:bg-border

                    nth-[2n]:after:hidden
                    sm:nth-[2n]:after:block
                    sm:nth-[3n]:after:hidden
                    lg:nth-[3n]:after:block
                    lg:nth-[6n]:after:hidden

                    before:content-[''] before:block before:absolute before:bottom-0 before:left-0 before:w-full before:h-px before:bg-border
                    last:before:hidden
                    ">
      <span className="text-sm sm:text-base text-text">
        {ingredient.value[locale]}
      </span>
      <span className="text-sm text-accent font-medium whitespace-nowrap">
        {ingredient.quantity} {unit?.label[locale]}
      </span>
    </div>
  );
};

export default RecipeIngredient;
