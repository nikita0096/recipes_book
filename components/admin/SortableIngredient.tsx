import React from 'react';
import {Ingredient} from "@/types";
import {useTypedLocale} from "@/hooks/useTypedLocale";
import {CiEdit} from "react-icons/ci";
import {MdDelete} from "react-icons/md";
import { MdDragIndicator } from "react-icons/md";
import {useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";

interface SoratableIngredientProps {
  ingredient: Ingredient;
  ingredientId: string;
  index: number;
  isEditing: boolean;
  startEditingIngredient: (ingredient: Ingredient) => void;
  removeIngredient: (index: number) => void;
}

const SortableIngredient = ({ingredient, ingredientId, index, isEditing, startEditingIngredient, removeIngredient}: SoratableIngredientProps) => {
  const locale = useTypedLocale();

  const {attributes, listeners, setNodeRef, transition, transform} = useSortable({
    id: ingredientId,
    disabled: !isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div className={`flex items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 border border-amber-100 dark:border-gray-600`}
         ref={setNodeRef}
         style={style}
    >
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-amber-500"/>
        <p className="text-gray-700 dark:text-gray-200 font-medium">{ingredient.value[locale]}</p>
      </div>
      <div className="flex items-center gap-2">
                        <span className="text-sm text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">
                          {ingredient.quantity} {ingredient.unit}
                        </span>
        {isEditing && (
          <div className='flex flex-row items-center gap-4'>
            <div className='flex items-center gap-2'>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => startEditingIngredient(ingredient)}
                className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors shadow-md p-1"
              >
                <CiEdit className="text-lg"/>
              </button>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => removeIngredient(index)}
                className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors shadow-md p-1"
              >
                <MdDelete className='text-lg'/>
              </button>
            </div>
            <div className="touch-none select-none"
                 {...attributes}
                 {...listeners}>
              <MdDragIndicator className={`text-2xl ${isEditing ? "cursor-grab active:cursor-grabbing" : undefined}`}/>
            </div>
          </div>

        )}
      </div>
    </div>
  );
};

export default SortableIngredient;