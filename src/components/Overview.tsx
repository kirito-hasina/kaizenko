import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarDays, PiggyBank, Receipt, Search, Target, Wallet } from 'lucide-react'
import { useStore } from '../store'
import {
  CATEGORIES, METHODS, dailyRate, dailySeries, fmtAr, fmtSigned, goalEstimate, humanDays,
  summarize, walletBalance,
} from '../lib'
import { Card, HighlightTile, Modal, Progress, Tile, btnDark, btnLight } from './ui'
import { DailyChart } from './LazyCharts'
import { TxForm } from './Wallet'
import type { Tab } from './Layout'

export default function Overview({ month, goTo }: { month: string; goTo: (t: Tab) => void }) {
  const plans = useStore((s) => s.plans)
  const expenses = useStore((s) => s.expenses)
  const txs = useStore((s) => s.walletTxs)
  const goals = useStore((s) => s.goals)

  const [txMode, setTxMode] = useState<'deposit' | 'withdraw' | null>(null)
  const [q, setQ] = useState('')

  const s = summarize(plans[month], expenses, month)
  const balance = walletBalance(txs)
  const rate = dailyRate(txs)

  const next = goals
    .map((g) => ({ g, e: goalEstimate(g, balance, rate) }))
    .filter((x) => !x.e.done)
    .sort((a, b) => a.e.remaining - b.e.remaining)[0]

  const recent = s.inMonth
    .filter((e) => e.label.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)

  const used = s.budget > 0 ? s.spent / s.budget : 0

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)_minmax(0,1fr)]">
        {/* colonne de gauche */}
        <div className="space-y-4 lg:row-span-2">
          <Card title="Solde du portefeuille">
            <div className="text-3xl font-bold tracking-tight">{fmtAr(balance)}</div>
            <div className="mt-1 text-xs text-muted">
              <span className={rate < 0 ? 'font-medium text-accent' : 'font-medium text-ok'}>
                {fmtSigned(Math.round(rate))} / jour
              </span>{' '}
              en moyenne sur 30 jours
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => setTxMode('deposit')} className={btnDark}>Déposer</button>
              <button onClick={() => setTxMode('withdraw')} className={btnLight}>Retirer</button>
            </div>
          </Card>

          <Card title="Limite du mois">
            <div className="text-2xl font-semibold tracking-tight">{fmtAr(s.spent)}</div>
            <div className="mb-3 text-xs text-muted">dépensés sur {fmtAr(s.budget)}</div>
            <Progress value={used} over={used > 1} />
            <div className="mt-2 text-xs text-muted">
              {s.budget > 0 ? `${Math.round(used * 100)} % de ton budget utilisé` : 'Enregistre ton plan dans l’onglet Budget.'}
            </div>
          </Card>

          <Card title="Prochain objectif">
            {next ? (
              <>
                <div className="flex items-center gap-2 font-medium">
                  <Target size={16} className="text-accent" /> {next.g.name}
                </div>
                <div className="mb-3 mt-3">
                  <Progress value={next.e.progress} />
                </div>
                <p className="text-xs text-muted">
                  {fmtAr(next.e.remaining)} restants ·{' '}
                  {next.e.days !== null ? `≈ ${humanDays(next.e.days)} à ce rythme` : 'pas de progression à ce rythme'}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted">Fixe-toi un but et vois en combien de temps tu l’atteins.</p>
                <button onClick={() => goTo('wallet')} className={`${btnLight} mt-3 w-full`}>
                  Créer un objectif
                </button>
              </>
            )}
          </Card>
        </div>

        {/* tuiles */}
        <div className="grid grid-cols-2 gap-4">
          <HighlightTile
            icon={PiggyBank}
            label="Il me reste"
            value={fmtAr(s.remaining)}
            hint={s.isCurrent ? `${fmtAr(s.perDay)} par jour, ${s.daysLeft} j restants` : undefined}
          />
          <Tile icon={Wallet} label="Budget disponible" value={fmtAr(s.budget)} />
          <Tile icon={Receipt} label="Déjà dépensé" value={fmtAr(s.spent)} />
          <Tile
            icon={CalendarDays}
            label={s.isCurrent ? 'Par jour' : 'Moyenne par jour'}
            value={fmtAr(s.isCurrent ? s.perDay : s.avgPerDay)}
          />
        </div>

        {/* graphique */}
        <Card title="Dépenses cumulées vs budget">
          <DailyChart data={dailySeries(expenses, month)} budget={s.budget} />
        </Card>

        {/* activités récentes */}
        <Card
          title="Activités récentes"
          className="lg:col-span-2"
          action={
            <label className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher"
                className="w-40 rounded-full border border-line bg-surface py-1.5 pl-8 pr-3 text-xs outline-none focus:border-accent"
              />
            </label>
          }
        >
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Aucune dépense à afficher.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-surface px-4 py-2">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr>
                    <th className="py-2 font-normal">Libellé</th>
                    <th className="hidden py-2 font-normal sm:table-cell">Catégorie</th>
                    <th className="hidden py-2 font-normal md:table-cell">Moyen</th>
                    <th className="hidden py-2 font-normal sm:table-cell">Date</th>
                    <th className="py-2 text-right font-normal">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((e) => (
                    <tr key={e.id} className="border-t border-line">
                      <td className="py-3 font-medium">{e.label}</td>
                      <td className="hidden py-3 sm:table-cell">
                        <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: CATEGORIES[e.category].color }} />
                        {CATEGORIES[e.category].label}
                      </td>
                      <td className="hidden py-3 text-muted md:table-cell">{METHODS[e.method]}</td>
                      <td className="hidden py-3 text-muted sm:table-cell">{format(parseISO(e.date), 'd MMM', { locale: fr })}</td>
                      <td className="py-3 text-right font-semibold">{fmtAr(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {txMode && (
        <Modal title={txMode === 'deposit' ? 'Déposer de l’argent' : 'Retirer de l’argent'} onClose={() => setTxMode(null)}>
          <TxForm mode={txMode} onDone={() => setTxMode(null)} />
        </Modal>
      )}
    </>
  )
}