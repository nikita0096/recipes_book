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
    <div className="flex items-baseline gap-2.5 py-2">
      <span className="text-sm text-text">
        {ingredient.value[locale]}
      </span>
      <span aria-hidden="true" className="flex-1 border-b border-dotted border-border -translate-y-1"/>
      <span
        className="text-base text-text whitespace-nowrap"
        style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
      >
        {ingredient.quantity}
        <span className="font-sans text-xs text-muted"> {unit?.label[locale]}</span>
      </span>
    </div>
  );
};

export default RecipeIngredient;