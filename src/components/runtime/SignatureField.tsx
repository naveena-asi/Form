import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Type as TypeIcon, PenLine, Eraser } from 'lucide-react'
import { useFormStore } from '@/store/useFormStore'
import { cn } from '@/lib/cn'

/**
 * Interactive signature field. The customer can either type their name (rendered
 * in a script font) or draw a signature on the canvas. The stored value is the
 * typed name, or a PNG data URL when drawn — so required-validation passes and
 * the signature appears in review / PDF.
 */
export function SignatureField({ apiName, disabled }: { apiName: string; disabled?: boolean }) {
  const value = useFormStore((s) => s.answers[apiName]) as string | undefined
  const setAnswer = useFormStore((s) => s.setAnswer)
  const isDrawn = typeof value === 'string' && value.startsWith('data:image')
  const [mode, setMode] = useState<'type' | 'draw'>(isDrawn ? 'draw' : 'type')

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const inked = useRef(false)

  // (Re)initialize the canvas whenever we enter draw mode; redraw a saved drawing.
  useEffect(() => {
    if (mode !== 'draw') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = w * ratio
    canvas.height = h * ratio
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1b2a5b'
    inked.current = false
    if (isDrawn && value) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, w, h)
      img.src = value
      inked.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const at = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const r = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const start = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled) return
    drawing.current = true
    const ctx = canvasRef.current!.getContext('2d')!
    const p = at(e)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    canvasRef.current!.setPointerCapture(e.pointerId)
  }
  const move = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = canvasRef.current!.getContext('2d')!
    const p = at(e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    inked.current = true
  }
  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    if (inked.current && canvasRef.current) setAnswer(apiName, canvasRef.current.toDataURL('image/png'))
  }
  const clear = () => {
    const canvas = canvasRef.current
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
    inked.current = false
    setAnswer(apiName, '')
  }

  return (
    <div>
      <div className="mb-1.5 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
        {([
          { id: 'type', label: 'Type', icon: TypeIcon },
          { id: 'draw', label: 'Draw', icon: PenLine },
        ] as const).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition',
              mode === m.id ? 'bg-white text-navy-800 shadow-sm' : 'text-slate-500',
            )}
          >
            <m.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'type' ? (
        <div className="rounded-lg border border-slate-300 bg-white px-3 pb-1.5 pt-2">
          <input
            className="w-full border-0 bg-transparent p-0 text-2xl leading-tight text-navy-800 placeholder:text-slate-300 focus:outline-none focus:ring-0"
            style={{ fontFamily: '"Segoe Script", "Brush Script MT", "Snell Roundhand", cursive' }}
            placeholder="Type your full name"
            value={isDrawn ? '' : value ?? ''}
            disabled={disabled}
            onChange={(e) => setAnswer(apiName, e.target.value)}
          />
          <div className="mt-1 border-t border-slate-200 pt-1 text-[10px] uppercase tracking-wide text-slate-400">
            Signature · {new Date().toISOString().slice(0, 10)}
          </div>
        </div>
      ) : (
        <div>
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="h-28 w-full cursor-crosshair touch-none rounded-lg border border-slate-300 bg-white"
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={end}
              onPointerLeave={end}
            />
            <button
              type="button"
              onClick={clear}
              className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-[11px] text-slate-500 ring-1 ring-slate-200 hover:text-red-500"
            >
              <Eraser className="h-3 w-3" /> Clear
            </button>
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">Draw your signature above</div>
        </div>
      )}
    </div>
  )
}
