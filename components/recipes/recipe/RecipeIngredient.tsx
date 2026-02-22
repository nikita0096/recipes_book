import React from 'react';
import {units} from "@/constants/units";
import {useTypedLocale} from "@/hooks/useTypedLocale";

interface IngredientProps {
  ingredient: {
    value: {en: string, ua: string};
    quantity: string;
    unit: string;
  }
}

const RecipeIngredient: React.FC<IngredientProps> = ({ingredient}) => {
  const locale = useTypedLocale();

  const unit = units.find((unit) => unit.value === ingredient.unit);

  return (
    <div

      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 border border-amber-100 dark:border-gray-600"
    >
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        <p className="text-gray-700 dark:text-gray-200 font-medium">{ingredient.value[locale]}</p>
      </div>
      <span className="text-sm text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">
                    {ingredient.quantity} {unit?.label[locale]}
                  </span>
    </div>
  );
};

export default RecipeIngredient;