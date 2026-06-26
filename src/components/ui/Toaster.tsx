import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react'
import { useToast, type ToastTone } from '@/store/useToast'
import { cn } from '@/lib/cn'

const toneMap: Record<ToastTone, { icon: typeof Info; cls: string }> = {
  success: { icon: CheckCircle2, cls: 'text-brand-600' },
  info: { icon: Info, cls: 'text-blue-600' },
  error: { icon: AlertCircle, cls: 'text-red-600' },
}

export function Toaster() {
  const toasts = useToast((s) => s.toasts)
  const dismiss = useToast((s) => s.dismiss)
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((t) => {
        const { icon: Icon, cls } = toneMap[t.tone]
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-pop"
          >
            <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', cls)} />
            <p className="flex-1 text-sm text-slate-700">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-slate-300 hover:text-slate-500">
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
