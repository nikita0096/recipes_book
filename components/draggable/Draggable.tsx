import {useDraggable} from '@dnd-kit/core';
import {CSS} from '@dnd-kit/utilities';
import {ReactNode} from "react";


export default function Draggable({children}: {children: ReactNode}) {
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: 'unique-id',
  });
  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </button>
  );
}