import React from 'react';
import {useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {MdDragIndicator} from "react-icons/md";

interface SortableItemProps {
  itemId: string;
  disabled?: boolean;
  className?: string;
  children: (dragHandle: React.ReactNode) => React.ReactNode;
}

// Generic sortable wrapper: renders children with a drag handle node to place anywhere inside
const SortableItem = ({itemId, disabled = false, className, children}: SortableItemProps) => {
  const {attributes, listeners, setNodeRef, transition, transform} = useSortable({
    id: itemId,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandle = (
    <div
      className="touch-none select-none p-1 text-muted"
      {...attributes}
      {...listeners}
    >
      <MdDragIndicator className={`text-lg ${!disabled ? "cursor-grab active:cursor-grabbing" : ""}`}/>
    </div>
  );

  return (
    <div ref={setNodeRef} style={style} className={className}>
      {children(dragHandle)}
    </div>
  );
};

export default SortableItem;