import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createPortal } from 'react-dom'

export const inputCls =
  'w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base text-ink placeholder:text-muted/70 outline-none transition focus:border-accent sm:text-sm'
const btn = 'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition active:scale-95'
export const btnDark = `${btn} bg-ink text-on-ink hover:opacity-90`
export const btnLight = `${btn} bg-surface text-ink hover:opacity-80`
export const btnAccent = `${btn} bg-accent text-white hover:brightness-110`

export function Card({
  title, action, className = '', children,
}: { title?: string; action?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`rounded-3xl bg-card p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-medium text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Tile({
  icon: Icon, label, value, tone = 'text-ink',
}: { icon: LucideIcon; label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-muted">{label}</span>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface text-muted">
          <Icon size={15} />
        </span>
      </div>
      <div className={`mt-3 text-xl font-semibold tracking-tight sm:text-2xl ${tone}`}>{value}</div>
    </div>
  )
}

export function HighlightTile({
  icon: Icon, label, value, hint,
}: { icon: LucideIcon; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-linear-to-br from-[#f4553a] to-[#d4121c] p-4 text-white shadow-lg shadow-accent/20">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-white/80">{label}</span>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/20">
          <Icon size={15} />
        </span>
      </div>
      <div className="mt-3 text-xl sm:text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-white/80">{hint}</div>}
    </div>
  )
}

/** value entre 0 et 1 */
export function Progress({ value, over = false }: { value: number; over?: boolean }) {
  const pct = Math.min(Math.max(value, 0), 1) * 100
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-surface">
      <div
        className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-ink' : 'bg-accent'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden' // la page derrière ne défile plus
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="animate-fade-up max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl bg-shell p-5 pb-8 shadow-2xl sm:max-w-md sm:rounded-3xl sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-medium text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:text-ink">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}