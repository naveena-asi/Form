import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface MenuItem {
  label: string
  icon?: LucideIcon
  onClick?: () => void
  danger?: boolean
}

export function Dropdown({
  trigger,
  items,
  align = 'right',
  width = 'w-48',
}: {
  trigger: ReactNode
  items: MenuItem[]
  align?: 'left' | 'right'
  width?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-pop',
            width,
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => {
                setOpen(false)
                it.onClick?.()
              }}
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition',
                it.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50',
              )}
            >
              {it.icon && <it.icon className="h-4 w-4" />}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
