import { useState } from 'react'
import { Card, btnDark, inputCls } from './ui'
import { useStore } from '../store'
import { fmtAr } from '../lib'

export default function PlanCard({ month }: { month: string }) {
  const plan = useStore((s) => s.plans[month])
  const setPlan = useStore((s) => s.setPlan)
  const [v, setV] = useState({
    income: plan?.income ?? 0,
    fixed: plan?.fixed ?? 0,
    savingsGoal: plan?.savingsGoal ?? 0,
  })

  const fields = [
    ['income', 'Revenus du mois'],
    ['fixed', 'Dépenses fixes (loyer, internet…)'],
    ['savingsGoal', 'Combien je veux épargner'],
  ] as const

  const budget = v.income - v.fixed - v.savingsGoal

  return (
    <Card title="Mon plan du mois">
      <div className="space-y-3">
        {fields.map(([key, label]) => (
          <label key={key} className="block text-xs text-muted">
            {label}
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={v[key] === 0 ? '' : v[key]}
              onChange={(e) => setV({ ...v, [key]: Number(e.target.value) })}
              placeholder="0 Ar"
              className={`${inputCls} mt-1`}
            />
          </label>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-sm">
        <span className="text-muted">Budget disponible</span>
        <span className={`font-semibold ${budget < 0 ? 'text-accent' : 'text-ok'}`}>{fmtAr(budget)}</span>
      </div>
      <button onClick={() => setPlan(month, v)} className={`${btnDark} mt-4 w-full`}>
        Enregistrer le plan
      </button>
    </Card>
  )
}