import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Pencil, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { CATEGORIES, METHODS, dailySeries, fmtAr, summarize, trend } from '../lib'
import type { Category, Expense } from '../types'
import { Card, Modal } from './ui'
import PlanCard from './PlanCard'
import ExpenseForm from './ExpenseForm'
import { CategoryDonut, DailyChart, TrendChart } from './LazyCharts'

const catKeys = Object.keys(CATEGORIES) as Category[]

export default function Budget({ month }: { month: string }) {
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [editing, setEditing] = useState<Expense | null>(null)

  const plans = useStore((s) => s.plans)
  const expenses = useStore((s) => s.expenses)
  const remove = useStore((s) => s.removeExpense)

  const plan = plans[month]
  const s = summarize(plan, expenses, month)
  const list = s.inMonth
    .filter((e) => filter === 'all' || e.category === filter)
    .sort((a, b) => b.date.localeCompare(a.date))

  const confirmRemove = (e: Expense) => {
    if (window.confirm(`Supprimer « ${e.label} » (${fmtAr(e.amount)}) ?`)) remove(e.id)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
      <div className="space-y-4">
        <PlanCard key={month + (plan ? 'set' : 'new')} month={month} />
        <Card title="Ajouter une dépense">
          <ExpenseForm key={month} month={month} />
        </Card>
      </div>

      <div className="space-y-4">
        {/* les 4 catégories Kakeibo */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {catKeys.map((k) => (
            <div key={k} className="rounded-2xl bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORIES[k].color }} />
                {CATEGORIES[k].label}
              </div>
              <div className="mt-2 text-lg font-semibold">{fmtAr(s.byCategory[k])}</div>
              <div className="text-[11px] text-muted">
                {s.spent > 0 ? Math.round((s.byCategory[k] / s.spent) * 100) : 0} % des dépenses
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
          <Card title="Répartition par catégorie">
            <CategoryDonut byCategory={s.byCategory} />
          </Card>
          <Card title="Dépenses cumulées vs budget">
            <DailyChart data={dailySeries(expenses, month)} budget={s.budget} />
          </Card>
        </div>

        <Card title="Tendance sur 6 mois">
          <TrendChart data={trend(plans, expenses, month)} />
        </Card>

        <Card title={`Dépenses du mois (${list.length})`}>
          <div className="mb-3 flex flex-wrap gap-2">
            {(['all', ...catKeys] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  filter === k ? 'bg-ink text-on-ink' : 'bg-surface text-muted hover:text-ink'
                }`}
              >
                {k === 'all' ? 'Toutes' : CATEGORIES[k].label}
              </button>
            ))}
          </div>

          {list.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Aucune dépense ici pour l’instant.</p>
          ) : (
            <ul className="divide-y divide-line rounded-2xl bg-surface px-4">
              {list.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-3">
                  <span className="h-8 w-1 rounded" style={{ background: CATEGORIES[e.category].color }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{e.label}</div>
                    <div className="text-[11px] text-muted">
                      {format(parseISO(e.date), 'd MMM', { locale: fr })} · {CATEGORIES[e.category].label} · {METHODS[e.method]}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{fmtAr(e.amount)}</div>
                  <button
                    onClick={() => setEditing(e)}
                    aria-label="Modifier"
                    className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-card hover:text-ink"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => confirmRemove(e)}
                    aria-label="Supprimer"
                    className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-card hover:text-accent"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {editing && (
        <Modal title="Modifier la dépense" onClose={() => setEditing(null)}>
          <ExpenseForm month={month} initial={editing} onDone={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  )
}