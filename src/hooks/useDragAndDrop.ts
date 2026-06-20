import { useCallback, useRef, useState } from 'react';

/**
 * 简易拖拽 Hook，支持鼠标和触屏
 * 返回事件处理器和拖拽状态
 */
export function useDragAndDrop<T = string>() {
  const [draggedItem, setDraggedItem] = useState<T | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const dragRef = useRef<T | null>(null);

  const onDragStart = useCallback((item: T) => {
    dragRef.current = item;
    setDraggedItem(item);
  }, []);

  const onDragEnd = useCallback(() => {
    dragRef.current = null;
    setDraggedItem(null);
    setDropTarget(null);
  }, []);

  const onDragOver = useCallback((targetId: string) => {
    setDropTarget(targetId);
  }, []);

  const onDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const onDrop = useCallback((targetId: string, onDropCallback?: (item: T, target: string) => void) => {
    if (dragRef.current && onDropCallback) {
      onDropCallback(dragRef.current, targetId);
    }
    setDraggedItem(null);
    setDropTarget(null);
    dragRef.current = null;
  }, []);

  return {
    draggedItem,
    dropTarget,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
  };
}
