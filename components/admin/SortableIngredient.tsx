import React from 'react';
import {Ingredient} from "@/types";
import {useTypedLocale} from "@/hooks/useTypedLocale";
import {CiEdit} from "react-icons/ci";
import {MdDelete, MdDragIndicator} from "react-icons/md";
import {useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {units} from "@/constants/units";

interface SortableIngredientProps {
  ingredient: Ingredient;
  ingredientId: string;
  index: number;
  isEditing: boolean;
  startEditingIngredient: (ingredient: Ingredient) => void;
  removeIngredient: (index: number) => void;
}

const SortableIngredient = ({ingredient, ingredientId, index, isEditing, startEditingIngredient, removeIngredient}: SortableIngredientProps) => {
  const locale = useTypedLocale();

  const {attributes, listeners, setNodeRef, transition, transform} = useSortable({
    id: ingredientId,
    disabled: !isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const unit = units.find((u) => u.value === ingredient.unit);

  return (
    <div
      className="relative bg-bg p-3 sm:p-4 flex justify-between items-start gap-3"
      ref={setNodeRef}
      style={style}
    >
      <span className="text-sm sm:text-base text-text">
        {ingredient.value[locale]}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-accent font-medium whitespace-nowrap">
          {ingredient.quantity} {unit?.label[locale]}
        </span>
        {isEditing && (
          <div className='flex items-center gap-1.5'>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => startEditingIngredient(ingredient)}
              className="p-1 text-muted hover:text-text transition-colors"
            >
              <CiEdit className="text-base"/>
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => removeIngredient(index)}
              className="p-1 text-muted hover:text-red-500 transition-colors"
            >
              <MdDelete className='text-base'/>
            </button>
            <div
              className="touch-none select-none p-1 text-muted"
              {...attributes}
              {...listeners}
            >
              <MdDragIndicator className={`text-lg ${isEditing ? "cursor-grab active:cursor-grabbing" : undefined}`}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SortableIngredient;