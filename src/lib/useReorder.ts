import { useState, type DragEvent } from 'react'

/**
 * Native HTML5 drag-and-drop list reordering. Returns per-index drag props plus
 * the current drag/over indices so the list can render drop affordances.
 */
export function useReorder(onReorder: (from: number, to: number) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const dragProps = (index: number) => ({
    draggable: true,
    onDragStart: (e: DragEvent) => {
      setDragIndex(index)
      e.dataTransfer.effectAllowed = 'move'
      // Carry the source index in the dataTransfer so onDrop never depends on a
      // not-yet-committed state update (works for both real and synthetic drags).
      e.dataTransfer.setData('text/plain', String(index))
    },
    onDragOver: (e: DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      if (overIndex !== index) setOverIndex(index)
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault()
      const from = Number(e.dataTransfer.getData('text/plain'))
      const source = Number.isNaN(from) ? dragIndex : from
      if (source !== null && source !== index) onReorder(source, index)
      setDragIndex(null)
      setOverIndex(null)
    },
    onDragEnd: () => {
      setDragIndex(null)
      setOverIndex(null)
    },
  })

  return { dragIndex, overIndex, dragProps }
}
