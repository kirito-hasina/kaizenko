import { useState } from 'react'
import { Check, Info } from 'lucide-react'
import { useStore } from '../store'
import {
  BUCKETS, PRESETS, allocationActual, allocationAmounts, allocationFor, fmtAr, matchPreset,
  monthLabel, rebalance,
} from '../lib'
import type { BucketKey } from '../lib'
import { Card, btnDark, inputCls } from './ui'

const KEYS: BucketKey[] = ['needs', 'wants', 'savings']

function CompareRow({
  k, planned, actual, income,
}: { k: BucketKey; planned: number; actual: number; income: number }) {
  const isSavings = k === 'savings'
  const ratio = planned > 0 ? Math.max(actual, 0) / planned : 0
  const over = !isSavings && actual > planned
  const diff = planned - actual
  const pctOfIncome = income > 0 ? Math.round((actual / income) * 100) : 0

  let status: string
  if (isSavings) {
    status = actual >= planned ? `Objectif atteint (+${fmtAr(actual - planned)})` : `Il manque ${fmtAr(diff)}`
  } else {
    status = diff >= 0 ? `Il te reste ${fmtAr(diff)}` : `Dépassé de ${fmtAr(-diff)}`
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-medium">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: BUCKETS[k].color }} />
          {BUCKETS[k].label}
        </span>
        <span className="text-xs text-muted">
          {fmtAr(actual)} / {fmtAr(planned)} · {pctOfIncome} % du revenu
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(ratio, 1) * 100}%`, background: over ? '#e0141f' : BUCKETS[k].color }}
        />
      </div>
      <div className={`mt-1.5 text-xs ${over ? 'font-medium text-accent' : 'text-muted'}`}>{status}</div>
    </div>
  )
}

export default function Repartition({ month }: { month: string }) {
  const plans = useStore((s) => s.plans)
  const allocations = useStore((s) => s.allocations)
  const expenses = useStore((s) => s.expenses)
  const txs = useStore((s) => s.walletTxs)
  const setPlan = useStore((s) => s.setPlan)
  const setAllocation = useStore((s) => s.setAllocation)
  const [applied, setApplied] = useState(false)

  const plan = plans[month]
  const income = plan?.income ?? 0
  const alloc = allocationFor(allocations, month)
  const amounts = allocationAmounts(income, alloc)
  const actual = allocationActual(expenses, txs, month)
  const presetId = matchPreset(alloc)

  const example = allocationAmounts(400000, PRESETS[0].a)
  const needsPct = income > 0 ? Math.round((actual.needs / income) * 100) : 0

  const setIncome = (value: number) =>
    setPlan(month, { income: value, fixed: plan?.fixed ?? 0, savingsGoal: plan?.savingsGoal ?? 0 })

  const applyToPlan = () => {
    setPlan(month, { income, fixed: plan?.fixed ?? 0, savingsGoal: amounts.savings })
    setApplied(true)
    window.setTimeout(() => setApplied(false), 4000)
  }

  return (
    <div className="space-y-4">
      {/* présentation */}
      <section className="rounded-3xl bg-linear-to-br from-[#f4553a] to-[#d4121c] p-6 text-white shadow-lg shadow-accent/20">
        <h2 className="text-2xl font-bold tracking-tight">Donnez une mission à chaque ariary.</h2>
        <p className="mt-2 max-w-2xl text-sm text-white/85">
          Répartis ton revenu mensuel entre tes dépenses essentielles, tes loisirs et ton épargne. Kaizenko calcule
          automatiquement les montants pour t’aider à garder le contrôle de tes finances.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* colonne de gauche : revenu et méthode */}
        <div className="space-y-4">
          <Card title="1. Mon revenu du mois">
            <label className="block text-xs text-muted">
              Salaire ou montant total dont tu disposes en {monthLabel(month)}
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={income === 0 ? '' : income}
                onChange={(e) => setIncome(Number(e.target.value))}
                placeholder="Ex. : 400000"
                className={`${inputCls} mt-1`}
              />
            </label>
          </Card>

          <Card title="2. Ma répartition">
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setAllocation(month, p.a)}
                  className={`rounded-2xl p-3 text-left transition ${
                    presetId === p.id ? 'bg-ink text-on-ink' : 'bg-surface hover:opacity-80'
                  }`}
                >
                  <div className="text-sm font-semibold">{p.label}</div>
                  <div className={`text-[11px] ${presetId === p.id ? 'opacity-70' : 'text-muted'}`}>{p.name}</div>
                </button>
              ))}
            </div>

            <p className="mt-3 text-xs text-muted">
              {presetId === 'custom'
                ? 'Répartition personnalisée.'
                : 'Choisis une méthode, ou ajuste les pourcentages ci-dessous.'}
            </p>

            <div className="mt-4 space-y-4">
              {KEYS.map((k) => (
                <div key={k}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: BUCKETS[k].color }} />
                      {BUCKETS[k].label}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={alloc[k]}
                        onChange={(e) => setAllocation(month, rebalance(alloc, k, Number(e.target.value)))}
                        aria-label={`Pourcentage ${BUCKETS[k].label}`}
                        className="w-14 rounded-lg border border-line bg-surface px-2 py-1 text-right text-sm text-ink outline-none focus:border-accent"
                      />
                      %
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={alloc[k]}
                    onChange={(e) => setAllocation(month, rebalance(alloc, k, Number(e.target.value)))}
                    aria-label={`Part ${BUCKETS[k].label}`}
                    className="w-full accent-accent"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-surface p-3 text-xs text-muted">
              <Info size={14} className="mt-0.5 shrink-0" />
              <p>
                Ces proportions sont un point de départ, pas une règle obligatoire. Si tes dépenses essentielles
                occupent 75 % de ton revenu, adapte la répartition à ta situation.
              </p>
            </div>
          </Card>
        </div>

        {/* colonne de droite : montants et comparaison */}
        <div className="space-y-4">
          <Card title="3. Les montants prévus">
            <div className="flex h-4 overflow-hidden rounded-full bg-surface">
              {KEYS.map((k) => (
                <div
                  key={k}
                  className="h-full transition-all duration-500"
                  style={{ width: `${alloc[k]}%`, background: BUCKETS[k].color }}
                />
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {KEYS.map((k) => (
                <div key={k} className="rounded-2xl bg-surface p-4">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: BUCKETS[k].color }} />
                    {BUCKETS[k].label}
                  </div>
                  <div className="mt-2 text-xl font-semibold tracking-tight">{fmtAr(amounts[k])}</div>
                  <div className="text-xs text-muted">{alloc[k]} % du revenu</div>
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs text-muted">
              {income > 0
                ? `100 % de ton revenu (${fmtAr(income)}) a une mission.`
                : 'Entre ton revenu pour voir les montants.'}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button onClick={applyToPlan} disabled={income <= 0} className={`${btnDark} disabled:opacity-40`}>
                <Check size={16} /> Appliquer à mon plan du mois
              </button>
              {applied && (
                <span className="animate-fade-up text-xs text-ok">
                  Fait : ton objectif d’épargne est maintenant de {fmtAr(amounts.savings)} (onglet Budget).
                </span>
              )}
            </div>
          </Card>

          <Card title="Prévu et réel ce mois-ci">
            <div className="space-y-5">
              {KEYS.map((k) => (
                <CompareRow key={k} k={k} planned={amounts[k]} actual={actual[k]} income={income} />
              ))}
            </div>

            {income > 0 && needsPct > alloc.needs && (
              <p className="mt-5 rounded-xl bg-surface p-3 text-xs text-muted">
                <b className="text-ink">Conseil :</b> tes besoins essentiels représentent déjà {needsPct} % de ton
                revenu, pour {alloc.needs} % prévus. Si c’est ta réalité, adapte la répartition (par exemple
                75 / 15 / 10) plutôt que de te forcer à suivre une règle qui ne te correspond pas.
              </p>
            )}

            <p className="mt-4 text-[11px] text-muted">
              Comment Kaizenko compare : Survie et Extra comptent dans les besoins essentiels, Optionnel et Culture
              dans les loisirs et envies, et l’épargne correspond aux dépôts nets de ton portefeuille ce mois-ci.
            </p>
          </Card>
        </div>
      </div>

      {/* explication */}
      <Card title="Comment ça marche ?">
        <ol className="grid gap-3 md:grid-cols-3">
          {[
            ['1. Entre ton revenu', 'Indique ton salaire ou le montant total dont tu disposes chaque mois.'],
            ['2. Choisis ta répartition', 'Utilise une méthode prédéfinie, comme le 50/30/20, ou définis tes propres pourcentages.'],
            ['3. Consulte les montants', 'Visualise la somme prévue pour chaque catégorie et compare-la ensuite à tes dépenses réelles.'],
          ].map(([title, text]) => (
            <li key={title} className="rounded-2xl bg-surface p-4">
              <div className="text-sm font-semibold">{title}</div>
              <p className="mt-1 text-xs text-muted">{text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-4 rounded-2xl bg-surface p-4">
          <div className="text-sm font-semibold">Exemple concret</div>
          <p className="mt-1 text-xs text-muted">
            Pour un revenu mensuel de {fmtAr(400000)}, avec la méthode 50/30/20 :
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {KEYS.map((k) => (
              <div key={k}>
                <div className="text-xs text-muted">{BUCKETS[k].label}</div>
                <div className="font-semibold">{fmtAr(example[k])}</div>
                <div className="text-[11px] text-muted">{PRESETS[0].a[k]} % du revenu</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}