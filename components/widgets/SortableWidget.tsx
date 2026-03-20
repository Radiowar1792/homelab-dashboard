"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { WidgetWrapper } from "./WidgetWrapper";
import type { WidgetConfig } from "@/types";

interface SortableWidgetProps {
  widget: WidgetConfig;
  isEditMode: boolean;
}

export function SortableWidget({ widget, isEditMode }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="contents">
      <WidgetWrapper
        widget={widget}
        isEditMode={isEditMode}
        dragHandleProps={{ ...attributes, ...listeners } as React.HTMLAttributes<HTMLButtonElement>}
        isDragging={isDragging}
      />
    </div>
  );
}
