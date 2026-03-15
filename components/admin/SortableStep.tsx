import {useTranslations} from "next-intl";
import Image from "next/image";
import React from "react";
import {CSS} from "@dnd-kit/utilities";
import {useSortable} from "@dnd-kit/sortable";
import {LocalizedText} from "@/types/forms";
import {useTypedLocale} from "@/hooks/useTypedLocale";
import {CiEdit} from "react-icons/ci";
import {MdDelete, MdDragIndicator} from "react-icons/md";

interface SortableStepProps {
  step: { desc: LocalizedText; imgUrl: string | null; id: string };
  stepId: string;
  index: number;
  isEditing: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
}

const SortableStep = ({step, stepId, index, isEditing, onEdit, onRemove}: SortableStepProps) => {
  const locale = useTypedLocale();
  const {attributes, listeners, setNodeRef, transition, transform} = useSortable({
    id: stepId,
    disabled: !isEditing,
  });

  const tRecipes = useTranslations('recipes');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden`}

    >
      {step.imgUrl && (
        <div className="relative h-64 md:h-80 w-full">
          <Image
            src={step.imgUrl}
            alt={`${tRecipes('singlePage.step')} ${index + 1}`}
            fill
            className="object-cover"
            unoptimized={step.imgUrl.startsWith('blob:')}
          />
        </div>
      )}
      <div className="flex flex-row items-center justify-between gap-2 p-6">
        <div className="flex flex-row items-center justify-center gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
            <span className="text-white font-bold">{index + 1}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {tRecipes('singlePage.step')} <span>{index + 1}</span>
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {step.desc[locale]}
            </p>
          </div>

        </div>
        {isEditing && (
          <div className=" flex items-center gap-5 z-10">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onEdit}
              className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors shadow-md p-2"
            >
              <CiEdit className="text-3xl"/>
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onRemove}
              className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-xl hover:bg-red-200 dark:hover:bg-red-900 transition-colors shadow-md p-2"
            >
              <MdDelete className="text-3xl"/>
            </button>
            <div
              className='touch-none select-none'
              {...attributes}
              {...listeners}>
              <MdDragIndicator className={`text-5xl ${isEditing ? "cursor-grabbing" : ""}`}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SortableStep;
