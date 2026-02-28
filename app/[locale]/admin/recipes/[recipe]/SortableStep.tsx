import {useTranslations} from "next-intl";
import Image from "next/image";
import React from "react";
import {CSS} from "@dnd-kit/utilities";
import {useSortable} from "@dnd-kit/sortable";
import {LocalizedText} from "@/services/db/insertRecipeToDatabase";
import {useTypedLocale} from "@/hooks/useTypedLocale";

interface SortableStepProps {
  step: { desc: LocalizedText; imgUrl: string | null; id: string };
  id: number;
}

const SortableStep = ({step, id}: SortableStepProps) => {
  const locale = useTypedLocale();
  const {attributes, listeners, setNodeRef, transition, transform} = useSortable({
    id: id,
  });

  const tRecipes = useTranslations('recipes');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef}
         style={style} {...attributes} {...listeners}>
      {
        step.imgUrl && (
          <div className="relative h-64 md:h-80 w-full">
            <Image
              src={step.imgUrl}
              alt={`${tRecipes('singlePage.step')} ${id + 1}`}
              fill
              className="object-cover"
              unoptimized={step.imgUrl.startsWith('blob:')}
            />
          </div>
        )
      }
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
            <span className="text-white font-bold">{id + 1}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {tRecipes('singlePage.step')} <span>{id + 1}</span>
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {step.desc[locale]}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
    ;
}

export default SortableStep;