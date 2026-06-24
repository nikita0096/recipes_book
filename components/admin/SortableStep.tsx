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
      className="bg-bg"
    >
      {/* Mobile/Tablet: Image on top */}
      {step.imgUrl && (
        <div className="lg:hidden">
          <div className="relative w-full aspect-video">
            <Image
              src={step.imgUrl}
              alt={`${tRecipes('singlePage.step')} ${index + 1}`}
              fill
              className="object-cover"
              unoptimized={step.imgUrl.startsWith('blob:')}
            />
          </div>
        </div>
      )}

      {/* Desktop: Grid layout with image on right */}
      <div className="lg:grid lg:grid-cols-[60px_1fr_1fr] lg:items-stretch">
        {/* Step number */}
        <div className="hidden lg:flex items-center pl-5 border-r border-border">
          <span className="text-base text-accent font-semibold">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        {/* Mobile/Tablet: Number + Description */}
        <div className="lg:hidden grid grid-cols-[44px_1fr] sm:grid-cols-[52px_1fr] items-center">
          <div className="pl-4 sm:pl-5 self-stretch flex items-center border-r border-border">
            <span className="text-sm sm:text-base text-accent font-semibold">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
          <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
            <p className="text-sm sm:text-base text-text leading-relaxed flex-1">
              {step.desc[locale]}
            </p>
            {isEditing && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={onEdit}
                  className="p-1.5 text-muted hover:text-text transition-colors"
                >
                  <CiEdit className="text-lg"/>
                </button>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={onRemove}
                  className="p-1.5 text-muted hover:text-red-500 transition-colors"
                >
                  <MdDelete className="text-lg"/>
                </button>
                <div
                  className='touch-none select-none p-1 text-muted'
                  {...attributes}
                  {...listeners}
                >
                  <MdDragIndicator className={`text-xl ${isEditing ? "cursor-grab active:cursor-grabbing" : ""}`}/>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop: Description */}
        <div className="hidden lg:flex items-center p-5 lg:px-7 overflow-hidden justify-between gap-4">
          <p className="text-base text-text leading-relaxed flex-1">
            {step.desc[locale]}
          </p>
        </div>

        {/* Desktop: Image */}
        <div className='hidden lg:block relative'>
          {step.imgUrl && (
            <div className=" border-l border-border">
              <div className="relative w-full h-full min-h-[220px] aspect-video">
                <Image
                  src={step.imgUrl}
                  alt={`${tRecipes('singlePage.step')} ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized={step.imgUrl.startsWith('blob:')}
                />

              </div>
            </div>
          )}
          {isEditing && (
            <div className="absolute top-3 right-3 flex items-center gap-2 shrink-0">
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onEdit}
                className="p-1.5 text-accent hover:text-text transition-colors bg-surface"
              >
                <CiEdit className="text-2xl"/>
              </button>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onRemove}
                className="p-1.5 text-red-500 hover:text-red-400 transition-colors bg-surface "
              >
                <MdDelete className="text-2xl"/>
              </button>
              <div
                className='touch-none select-none p-1 text-accent bg-surface'
                {...attributes}
                {...listeners}
              >
                <MdDragIndicator className={`text-2xl ${isEditing ? "cursor-grab active:cursor-grabbing" : ""}`}/>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SortableStep;
