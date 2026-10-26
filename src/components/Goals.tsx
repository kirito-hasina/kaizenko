import { useState } from 'react'
import type { FormEvent } from 'react'
import { parseISO } from 'date-fns'
import { Plus, Target, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { estimateWithRate, fmtAr, fmtDate, fmtSigned, goalEstimate, humanDays, todayStr } from '../lib'
import type { Goal } from '../types'
import { Card, Progress, btnDark, inputCls } from './ui'

function GoalForm() {
  const add = useStore((s) => s.addGoal)
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const t = Number(target)
    if (!name.trim() || !t || t <= 0) return
    add({ name: name.trim(), target: t, deadline: deadline || undefined })
    setName('')
    setTarget('')
    setDeadline('')
  }

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Mon objectif (ex. : ordinateur)" className={inputCls} />
      <input required type="number" min={1} inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Montant visé (Ar)" className={inputCls} />
      <input type="date" min={todayStr()} value={deadline} onChange={(e) => setDeadline(e.target.value)} title="Date limite (facultatif)" className={inputCls} />
      <button type="submit" className={btnDark}>
        <Plus size={16} /> Ajouter
      </button>
    </form>
  )
}

function GoalCard({ goal, balance, rate }: { goal: Goal; balance: number; rate: number }) {
  const remove = useStore((s) => s.removeGoal)
  const [sim, setSim] = useState('')

  const e = goalEstimate(goal, balance, rate)
  const simPerDay = Number(sim)
  const simEst = simPerDay > 0 ? estimateWithRate(e.remaining, simPerDay) : null

  return (
    <div className="rounded-3xl bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-surface text-accent">
            <Target size={18} />
          </span>
          <div>
            <div className="font-medium">{goal.name}</div>
            <div className="text-xs text-muted">Objectif : {fmtAr(goal.target)}</div>
          </div>
        </div>
        <button
          onClick={() => window.confirm(`Supprimer l’objectif « ${goal.name} » ?`) && remove(goal.id)}
          aria-label="Supprimer"
          className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-surface hover:text-accent"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="mt-4">
        <Progress value={e.progress} />
        <div className="mt-2 flex justify-between text-xs text-muted">
          <span>{fmtAr(Math.max(balance, 0))} / {fmtAr(goal.target)}</span>
          <span>{Math.round(e.progress * 100)} %</span>
        </div>
      </div>

      <div className="mt-4 space-y-2 rounded-2xl bg-surface p-4 text-sm">
        {e.done ? (
          <p className="font-medium text-ok">Objectif atteint, bravo !</p>
        ) : (
          <>
            <p>Il te reste <b>{fmtAr(e.remaining)}</b>.</p>

            {e.days !== null ? (
              <p>
                Au rythme actuel ({fmtSigned(Math.round(rate))} / jour) : <b>≈ {humanDays(e.days)}</b>
                {e.date && <> — vers le {fmtDate(e.date)}</>}.
              </p>
            ) : (
              <p className="text-accent">
                Au rythme actuel ({fmtSigned(Math.round(rate))} / jour), tu n’avances pas. Dépose plus que tu ne retires.
              </p>
            )}

            {goal.deadline && e.neededPerDay !== null && (
              <p className="text-muted">
                Pour y arriver avant le {fmtDate(parseISO(goal.deadline))} : {fmtAr(e.neededPerDay)} / jour
                (≈ {fmtAr(e.neededPerDay * 7)} / semaine).
              </p>
            )}
            {e.overdue && <p className="text-accent">La date limite est dépassée.</p>}
          </>
        )}
      </div>

      {!e.done && (
        <div className="mt-3">
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={sim}
            onChange={(ev) => setSim(ev.target.value)}
            placeholder="Et si je mettais … Ar par jour ?"
            className={inputCls}
          />
          {simEst && simEst.days !== null && (
            <p className="mt-2 text-sm">
              Avec {fmtAr(simPerDay)} / jour : <b>≈ {humanDays(simEst.days)}</b>
              {simEst.date && <> — vers le {fmtDate(simEst.date)}</>}.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function Goals({ balance, rate }: { balance: number; rate: number }) {
  const goals = useStore((s) => s.goals)
  const sorted = [...goals].sort((a, b) => a.target - b.target)

  return (
    <div className="space-y-4">
      <Card title="Nouvel objectif">
        <GoalForm />
        <p className="mt-3 text-xs text-muted">
          Chaque objectif se mesure sur le solde total de ton portefeuille.
        </p>
      </Card>

      {sorted.length === 0 ? (
        <p className="rounded-3xl bg-card py-10 text-center text-sm text-muted">
          Aucun objectif pour l’instant. Crée le premier ci-dessus.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {sorted.map((g) => (
            <GoalCard key={g.id} goal={g} balance={balance} rate={rate} />
          ))}
        </div>
      )}
    </div>
  )
}