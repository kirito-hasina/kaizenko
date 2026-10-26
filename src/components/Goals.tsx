import { useState } from 'react'
import type { FormEvent } from 'react'
import { parseISO } from 'date-fns'
import { Plus, Target, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { estimateWithRate, fmtAr, fmtDate, fmtSigned, goalEstimate, humanDays, todayStr } from '../lib'
import type { Goal } from '../types'
import { Card, ConfirmModal, btnDark, btnLight, inputCls } from './ui'

const GOAL_COLORS = ['#e0141f', '#f97316', '#8b5cf6', '#10b981', '#3b82f6', '#eab308', '#ec4899', '#14b8a6']
const colorOf = (index: number) => GOAL_COLORS[index % GOAL_COLORS.length]
const usedPercent = (goals: Goal[]) => goals.reduce((sum, g) => sum + g.percent, 0)

/* ---------- nouvel objectif ---------- */

function GoalForm({ free }: { free: number }) {
  const add = useStore((s) => s.addGoal)
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [percent, setPercent] = useState('')
  const [deadline, setDeadline] = useState('')
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const t = Number(target)
    const p = percent === '' ? free : Number(percent) // vide = toute la part libre
    if (!name.trim() || !t || t <= 0) return
    if (p < 0 || p > 100) {
      setError('Le pourcentage doit être entre 0 et 100.')
      return
    }
    if (p > free) {
      setError(`Il ne reste que ${free} % de libre. Choisis moins, ou diminue la part d’un autre objectif.`)
      return
    }
    add({ name: name.trim(), target: t, percent: p, deadline: deadline || undefined })
    setName('')
    setTarget('')
    setPercent('')
    setDeadline('')
    setError('')
  }

  return (
    <form onSubmit={submit}>
      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_0.9fr_1fr_auto]">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Mon objectif (ex. : ordinateur)" className={inputCls} />
        <input required type="number" min={1} inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Montant visé (Ar)" className={inputCls} />
        <input type="number" min={0} max={100} inputMode="numeric" value={percent} onChange={(e) => setPercent(e.target.value)} placeholder={`% du solde (libre : ${free})`} className={inputCls} />
        <input type="date" min={todayStr()} value={deadline} onChange={(e) => setDeadline(e.target.value)} title="Date limite (facultatif)" className={inputCls} />
        <button type="submit" className={btnDark}>
          <Plus size={16} /> Ajouter
        </button>
      </div>
      {error ? (
        <p className="mt-3 text-xs text-accent">{error}</p>
      ) : (
        <p className="mt-3 text-xs text-muted">
          Chaque objectif reçoit une part de ton portefeuille (le total ne dépasse jamais 100 %). Il reste{' '}
          <b className="text-ink">{free} %</b> de libre.
        </p>
      )}
    </form>
  )
}

/* ---------- répartition du portefeuille ---------- */

function AllocationCard({ balance }: { balance: number }) {
  const goals = useStore((s) => s.goals)
  const distribute = useStore((s) => s.distributeGoals)
  if (goals.length === 0) return null

  const free = Math.max(100 - usedPercent(goals), 0)
  const money = (p: number) => fmtAr((Math.max(balance, 0) * p) / 100)

  return (
    <Card
      title="Répartition de mon portefeuille"
      action={
        <button onClick={distribute} className={`${btnLight} px-3 py-1.5 text-xs`}>
          Répartir équitablement
        </button>
      }
    >
      <div className="flex h-3 overflow-hidden rounded-full bg-surface">
        {goals.map((g, i) => (
          <div
            key={g.id}
            title={`${g.name} : ${g.percent} %`}
            className="h-full transition-all duration-500"
            style={{ width: `${g.percent}%`, background: colorOf(i) }}
          />
        ))}
      </div>

      <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        {goals.map((g, i) => (
          <li key={g.id} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorOf(i) }} />
              <span className="truncate">{g.name}</span>
            </span>
            <span className="shrink-0 text-muted">{g.percent} % · {money(g.percent)}</span>
          </li>
        ))}
        <li className="flex items-center justify-between gap-3 text-muted">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-surface ring-1 ring-line" /> Non alloué
          </span>
          <span>{free} % · {money(free)}</span>
        </li>
      </ul>
    </Card>
  )
}

/* ---------- carte d'un objectif ---------- */

function GoalCard({
  goal, color, free, balance, rate,
}: { goal: Goal; color: string; free: number; balance: number; rate: number }) {
  const setPercent = useStore((s) => s.setGoalPercent)
  const remove = useStore((s) => s.removeGoal)
  const [sim, setSim] = useState('')
  const [confirming, setConfirming] = useState(false)

  const e = goalEstimate(goal, balance, rate)
  const simPerDay = Number(sim)
  const simEst = simPerDay > 0 ? estimateWithRate(e.remaining, simPerDay) : null

  return (
    <>
      <div className="rounded-3xl bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-surface" style={{ color }}>
              <Target size={18} />
            </span>
            <div>
              <div className="font-medium">{goal.name}</div>
              <div className="text-xs text-muted">Objectif : {fmtAr(goal.target)}</div>
            </div>
          </div>
          <button
            onClick={() => setConfirming(true)}
            aria-label={`Supprimer l’objectif ${goal.name}`}
            className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-surface hover:text-accent"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {/* part du portefeuille */}
        <div className="mt-4 rounded-2xl bg-surface p-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted">Part de mon portefeuille</span>
            <span className="font-semibold">{goal.percent} % · {fmtAr(e.allocated)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={goal.percent + free}
            step={1}
            value={goal.percent}
            onChange={(ev) => setPercent(goal.id, Number(ev.target.value))}
            aria-label={`Part du portefeuille pour ${goal.name}`}
            className="w-full accent-accent"
          />
          <div className="mt-1 text-[11px] text-muted">
            Maximum possible : {goal.percent + free} % (le reste est réservé à d’autres objectifs).
          </div>
        </div>

        {/* progression */}
        <div className="mt-4">
          <div className="h-2.5 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${e.progress * 100}%`, background: color }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>{fmtAr(e.allocated)} / {fmtAr(goal.target)}</span>
            <span>{Math.round(e.progress * 100)} %</span>
          </div>
        </div>

        {/* estimation */}
        <div className="mt-4 space-y-2 rounded-2xl bg-surface p-4 text-sm">
          {e.done ? (
            <p className="font-medium text-ok">Objectif atteint, bravo !</p>
          ) : goal.percent === 0 ? (
            <p className="text-accent">
              Aucune part de ton portefeuille n’est réservée à cet objectif. Augmente le pourcentage ci-dessus.
            </p>
          ) : (
            <>
              <p>Il te reste <b>{fmtAr(e.remaining)}</b>.</p>

              {e.days !== null ? (
                <p>
                  Avec {goal.percent} % de ton rythme ({fmtSigned(Math.round(e.goalRate))} / jour pour cet objectif) :{' '}
                  <b>≈ {humanDays(e.days)}</b>
                  {e.date && <> — vers le {fmtDate(e.date)}</>}.
                </p>
              ) : (
                <p className="text-accent">
                  À ce rythme ({fmtSigned(Math.round(e.goalRate))} / jour pour cet objectif), tu n’avances pas.
                  Dépose plus que tu ne retires.
                </p>
              )}

              {goal.deadline && e.neededPerDay !== null && (
                <p className="text-muted">
                  Pour y arriver avant le {fmtDate(parseISO(goal.deadline))} : {fmtAr(e.neededPerDay)} / jour
                  dans cet objectif (≈ {fmtAr(e.neededPerDay * 7)} / semaine).
                </p>
              )}
              {e.overdue && <p className="text-accent">La date limite est dépassée.</p>}
            </>
          )}
        </div>

        {!e.done && goal.percent > 0 && (
          <div className="mt-3">
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={sim}
              onChange={(ev) => setSim(ev.target.value)}
              placeholder="Et si je mettais … Ar par jour dans cet objectif ?"
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

      {confirming && (
        <ConfirmModal
          title="Supprimer cet objectif ?"
          confirmLabel="Oui, supprimer"
          onCancel={() => setConfirming(false)}
          onConfirm={() => remove(goal.id)}
        >
          <p>
            L’objectif <b className="text-ink">« {goal.name} »</b> ({fmtAr(goal.target)}) sera définitivement supprimé.
          </p>
          <p className="mt-2">
            Ton argent n’est pas touché : les {goal.percent} % qui lui étaient réservés redeviennent libres pour
            tes autres objectifs.
          </p>
        </ConfirmModal>
      )}
    </>
  )
}

/* ---------- section complète ---------- */

export default function Goals({ balance, rate }: { balance: number; rate: number }) {
  const goals = useStore((s) => s.goals)
  const free = Math.max(100 - usedPercent(goals), 0)

  return (
    <div className="space-y-4">
      <Card title="Nouvel objectif">
        <GoalForm free={free} />
      </Card>

      <AllocationCard balance={balance} />

      {goals.length === 0 ? (
        <p className="rounded-3xl bg-card py-10 text-center text-sm text-muted">
          Aucun objectif pour l’instant. Crée le premier ci-dessus.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {goals.map((g, i) => (
            <GoalCard key={g.id} goal={g} color={colorOf(i)} free={free} balance={balance} rate={rate} />
          ))}
        </div>
      )}
    </div>
  )
}