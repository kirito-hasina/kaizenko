import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, LayoutGrid, Moon, PiggyBank, Receipt, Sun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useStore } from '../store'
import { monthKey, monthLabel, shiftMonth } from '../lib'

export type Tab = 'overview' | 'budget' | 'wallet'

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Aperçu', icon: LayoutGrid },
  { id: 'budget', label: 'Budget', icon: Receipt },
  { id: 'wallet', label: 'Portefeuille', icon: PiggyBank },
]

export function MonthNav({ month, setMonth }: { month: string; setMonth: (m: string) => void }) {
  const isCurrent = month === monthKey()
  const arrow =
    'grid h-10 w-10 place-items-center rounded-full bg-surface text-ink transition hover:opacity-80 active:scale-95'
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Mois précédent" className={arrow}>
        <ChevronLeft size={18} />
      </button>
      <div className="min-w-32 text-center text-sm font-medium capitalize">{monthLabel(month)}</div>
      <button onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Mois suivant" className={arrow}>
        <ChevronRight size={18} />
      </button>
      {!isCurrent && (
        <button
          onClick={() => setMonth(monthKey())}
          className="rounded-full bg-ink px-3 py-2.5 text-xs text-on-ink transition hover:opacity-90"
        >
          Aujourd’hui
        </button>
      )}
    </div>
  )
}

type ShellProps = {
  tab: Tab
  setTab: (t: Tab) => void
  title: string
  subtitle: string
  right?: ReactNode
  children: ReactNode
}

export default function Shell({ tab, setTab, title, subtitle, right, children }: ShellProps) {
  const theme = useStore((s) => s.theme)
  const toggleTheme = useStore((s) => s.toggleTheme)

  return (
    <div className="min-h-screen p-2 sm:p-5">
      <div className="mx-auto max-w-350 rounded-[2rem] bg-shell p-3 sm:p-6">
        {/* barre du haut : 2 lignes sur mobile, 1 ligne sur ordinateur */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="order-1 flex items-center gap-2 rounded-full bg-surface py-1.5 pl-3 pr-4 shadow-sm">
            <img src="/kaizenko-mark.png" alt="" className="h-7 w-7 object-contain" />
            <span className="text-sm font-semibold">Kaizenko</span>
          </div>

          <div className="order-2 flex items-center gap-2 md:order-3">
            <div className="hidden rounded-full bg-surface px-4 py-2 text-xs capitalize text-muted shadow-sm md:block">
              {format(new Date(), 'EEEE d MMMM', { locale: fr })}
            </div>
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              className="grid h-10 w-10 place-items-center rounded-full bg-surface text-ink shadow-sm transition hover:opacity-80 active:scale-95"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <nav className="order-3 grid w-full grid-cols-3 gap-1 rounded-full bg-surface p-1 shadow-sm md:order-2 md:flex md:w-auto">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`rounded-full px-3 py-2.5 text-center text-sm font-medium transition md:px-4 md:py-2 ${
                  tab === id ? 'bg-ink text-on-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6 flex gap-6">
          {/* barre latérale (ordinateur seulement) */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 flex flex-col gap-2 rounded-full bg-card p-2">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  aria-label={label}
                  title={label}
                  className={`grid h-10 w-10 place-items-center rounded-full transition ${
                    tab === id ? 'bg-ink text-on-ink' : 'text-muted hover:bg-surface hover:text-ink'
                  }`}
                >
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                <p className="mt-1 text-sm text-muted">{subtitle}</p>
              </div>
              {right}
            </div>
            <div key={tab} className="animate-fade-up">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}