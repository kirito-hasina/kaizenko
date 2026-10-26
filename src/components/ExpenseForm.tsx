import { useState } from 'react'
import type { FormEvent } from 'react'
import { Check, Plus } from 'lucide-react'
import { btnAccent, inputCls } from './ui'
import { useStore } from '../store'
import { CATEGORIES, METHODS, monthKey, todayStr } from '../lib'
import type { Category, Expense, Method } from '../types'

const catKeys = Object.keys(CATEGORIES) as Category[]

type Props = {
  month: string
  initial?: Expense // si présent : mode modification
  onDone?: () => void
}

export default function ExpenseForm({ month, initial, onDone }: Props) {
  const add = useStore((s) => s.addExpense)
  const update = useStore((s) => s.updateExpense)

  const defaultDate = month === monthKey() ? todayStr() : `${month}-01`
  const [f, setF] = useState({
    amount: initial ? String(initial.amount) : '',
    label: initial?.label ?? '',
    category: (initial?.category ?? 'survie') as Category,
    method: (initial?.method ?? 'especes') as Method,
    date: initial?.date ?? defaultDate,
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const amount = Number(f.amount)
    if (!amount || amount <= 0) return

    const data = {
      amount,
      label: f.label.trim() || CATEGORIES[f.category].label,
      category: f.category,
      method: f.method,
      date: f.date,
    }

    if (initial) {
      update(initial.id, data)
      onDone?.()
    } else {
      add(data)
      setF({ ...f, amount: '', label: '' })
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          required
          type="number"
          min={1}
          inputMode="numeric"
          value={f.amount}
          onChange={(e) => setF({ ...f, amount: e.target.value })}
          placeholder="Montant (Ar)"
          className={inputCls}
        />
        <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={inputCls} />
      </div>

      <input
        value={f.label}
        onChange={(e) => setF({ ...f, label: e.target.value })}
        placeholder="Libellé (ex. : riz, taxi-be, MVola…)"
        className={inputCls}
      />

      <div className="grid grid-cols-2 gap-2">
        {catKeys.map((k) => (
          <button
            type="button"
            key={k}
            onClick={() => setF({ ...f, category: k })}
            className={`rounded-xl border px-3 py-2 text-left text-xs transition ${
              f.category === k ? 'text-ink' : 'border-transparent bg-surface text-muted hover:text-ink'
            }`}
            style={f.category === k ? { background: `${CATEGORIES[k].color}1f`, borderColor: CATEGORIES[k].color } : undefined}
          >
            <div className="font-medium">{CATEGORIES[k].label}</div>
            <div className="mt-0.5 text-[10px] opacity-70">{CATEGORIES[k].hint}</div>
          </button>
        ))}
      </div>

      <select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value as Method })} className={inputCls}>
        {(Object.keys(METHODS) as Method[]).map((m) => (
          <option key={m} value={m}>{METHODS[m]}</option>
        ))}
      </select>

      <button type="submit" className={`${btnAccent} w-full`}>
        {initial ? <Check size={16} /> : <Plus size={16} />}
        {initial ? 'Enregistrer' : 'Ajouter'}
      </button>
    </form>
  )
}