import { useState } from 'react'
import type { FormEvent } from 'react'
import { format, parseISO, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Trash2, TrendingUp } from 'lucide-react'
import { useStore } from '../store'
import { balanceSeries, dailyRate, fmtAr, fmtSigned, todayStr, walletBalance } from '../lib'
import { Card, HighlightTile, Tile, btnAccent, btnDark, inputCls } from './ui'
import { BalanceChart } from './LazyCharts'
import Goals from './Goals'

/** formulaire de dépôt / retrait (utilisé ici et dans l'Aperçu) */
export function TxForm({
  mode: initial = 'deposit',
  onDone,
}: {
  mode?: 'deposit' | 'withdraw'
  onDone?: () => void
}) {
  const add = useStore((s) => s.addTx)
  const balance = useStore((s) => walletBalance(s.walletTxs))
  const [mode, setMode] = useState<'deposit' | 'withdraw'>(initial)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayStr())

  const n = Number(amount)
  const tooMuch = mode === 'withdraw' && n > balance

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!n || n <= 0) return
    add({
      date,
      amount: mode === 'deposit' ? n : -n,
      note: note.trim() || (mode === 'deposit' ? 'Dépôt' : 'Retrait'),
    })
    setAmount('')
    setNote('')
    onDone?.()
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-1 rounded-full bg-surface p-1">
        {(['deposit', 'withdraw'] as const).map((m) => (
          <button
            type="button"
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-full py-2 text-sm font-medium transition ${
              mode === m ? (m === 'deposit' ? 'bg-ink text-on-ink' : 'bg-accent text-white') : 'text-muted'
            }`}
          >
            {m === 'deposit' ? 'Dépôt' : 'Retrait'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          required
          type="number"
          min={1}
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Montant (Ar)"
          className={inputCls}
        />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={mode === 'deposit' ? 'Note (ex. : petit boulot, cadeau…)' : 'Note (ex. : transport, urgence…)'}
        className={inputCls}
      />

      {tooMuch && (
        <p className="text-xs text-accent">Attention : ce retrait dépasse ton solde ({fmtAr(balance)}).</p>
      )}

      <button type="submit" className={`${mode === 'deposit' ? btnDark : btnAccent} w-full`}>
        {mode === 'deposit' ? 'Déposer' : 'Retirer'}
      </button>
    </form>
  )
}

export default function WalletPage() {
  const txs = useStore((s) => s.walletTxs)
  const remove = useStore((s) => s.removeTx)

  const balance = walletBalance(txs)
  const rate = dailyRate(txs)

  const from = format(subDays(new Date(), 29), 'yyyy-MM-dd')
  const last30 = txs.filter((t) => t.date >= from && t.date <= todayStr())
  const deposited = last30.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const withdrawn = last30.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)

  const history = [...txs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <HighlightTile
          icon={PiggyBank}
          label="Solde du portefeuille"
          value={fmtAr(balance)}
          hint={`${fmtSigned(Math.round(rate))} / jour en moyenne`}
        />
        <Tile
          icon={TrendingUp}
          label="Gain moyen / jour (30 j)"
          value={fmtSigned(Math.round(rate))}
          tone={rate < 0 ? 'text-accent' : 'text-ink'}
        />
        <Tile icon={ArrowDownLeft} label="Déposé (30 j)" value={fmtAr(deposited)} />
        <Tile icon={ArrowUpRight} label="Retiré (30 j)" value={fmtAr(Math.abs(withdrawn))} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card title="Déposer ou retirer">
          <TxForm />
        </Card>
        <Card title="Évolution du solde (30 jours)">
          <BalanceChart data={balanceSeries(txs)} />
        </Card>
      </div>

      <Card title={`Derniers mouvements (${txs.length})`}>
        {history.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">Aucun mouvement pour l’instant.</p>
        ) : (
          <ul className="divide-y divide-line rounded-2xl bg-surface px-4">
            {history.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                    t.amount > 0 ? 'bg-ink text-on-ink' : 'bg-accent text-white'
                  }`}
                >
                  {t.amount > 0 ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{t.note}</div>
                  <div className="text-[11px] text-muted">{format(parseISO(t.date), 'd MMM yyyy', { locale: fr })}</div>
                </div>
                <div className={`text-sm font-semibold ${t.amount > 0 ? 'text-ok' : 'text-accent'}`}>
                  {fmtSigned(t.amount)}
                </div>
                <button
                  onClick={() => window.confirm('Supprimer ce mouvement ?') && remove(t.id)}
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

      <Goals balance={balance} rate={rate} />
    </div>
  )
}