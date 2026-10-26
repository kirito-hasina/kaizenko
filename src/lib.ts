import {
  addDays, differenceInCalendarDays, endOfMonth, format, getDaysInMonth, parseISO, subDays,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Category, Expense, Goal, Method, MonthPlan, WalletTx } from './types'

export const CATEGORIES: Record<Category, { label: string; hint: string; color: string }> = {
  survie: { label: 'Survie', hint: 'Loyer, nourriture, transport, santé', color: '#64748b' },
  optionnel: { label: 'Optionnel', hint: 'Sorties, snacks, shopping', color: '#f97316' },
  culture: { label: 'Culture', hint: 'Livres, cours, formations, sport', color: '#8b5cf6' },
  extra: { label: 'Extra', hint: 'Imprévus et dépenses exceptionnelles', color: '#10b981' },
}

export const METHODS: Record<Method, string> = {
  especes: 'Espèces',
  mvola: 'MVola',
  orange: 'Orange Money',
  airtel: 'Airtel Money',
  carte: 'Carte',
}

export const fmtAr = (n: number) =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n))} Ar`

export const fmtSigned = (n: number) =>
  `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmtAr(Math.abs(n))}`

export const fmtDate = (d: Date) => format(d, 'd MMMM yyyy', { locale: fr })

/* ---------- mois ---------- */

export const monthKey = (d = new Date()) => format(d, 'yyyy-MM')
export const todayStr = () => format(new Date(), 'yyyy-MM-dd')

const parseMonth = (key: string) => new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1)

export function shiftMonth(key: string, delta: number) {
  const d = parseMonth(key)
  d.setMonth(d.getMonth() + delta)
  return monthKey(d)
}

export const monthLabel = (key: string) => format(parseMonth(key), 'MMMM yyyy', { locale: fr })
export const monthShort = (key: string) => format(parseMonth(key), 'MMM', { locale: fr })

/* ---------- budget Kakeibo ---------- */

export function summarize(plan: MonthPlan | undefined, expenses: Expense[], key: string) {
  const inMonth = expenses.filter((e) => e.date.startsWith(key))
  const spent = inMonth.reduce((sum, e) => sum + e.amount, 0)

  const byCategory: Record<Category, number> = { survie: 0, optionnel: 0, culture: 0, extra: 0 }
  inMonth.forEach((e) => {
    byCategory[e.category] += e.amount
  })

  // formule Kakeibo : revenus − dépenses fixes − épargne voulue
  const budget = plan ? plan.income - plan.fixed - plan.savingsGoal : 0
  const remaining = budget - spent

  const now = new Date()
  const daysInMonth = getDaysInMonth(parseMonth(key))
  const isCurrent = key === monthKey(now)
  const daysLeft = isCurrent ? differenceInCalendarDays(endOfMonth(now), now) + 1 : daysInMonth
  const perDay = daysLeft > 0 ? Math.max(remaining, 0) / daysLeft : 0
  const avgPerDay = spent / daysInMonth

  return { inMonth, spent, byCategory, budget, remaining, daysLeft, perDay, avgPerDay, isCurrent }
}

/** cumul des dépenses jour par jour (jusqu'à aujourd'hui pour le mois en cours) */
export function dailySeries(expenses: Expense[], key: string) {
  const days = getDaysInMonth(parseMonth(key))
  const lastDay = key === monthKey() ? new Date().getDate() : days

  const perDay: number[] = new Array(days).fill(0)
  expenses
    .filter((e) => e.date.startsWith(key))
    .forEach((e) => {
      perDay[Number(e.date.slice(8, 10)) - 1] += e.amount
    })

  let cumul = 0
  return perDay.slice(0, lastDay).map((value, i) => {
    cumul += value
    return { day: i + 1, jour: value, cumul }
  })
}

/** dépensé vs budget sur les n derniers mois */
export function trend(plans: Record<string, MonthPlan>, expenses: Expense[], key: string, n = 6) {
  return Array.from({ length: n }, (_, i) => {
    const k = shiftMonth(key, i - (n - 1))
    const s = summarize(plans[k], expenses, k)
    return { mois: monthShort(k), depense: s.spent, budget: s.budget }
  })
}

/* ---------- portefeuille et objectifs ---------- */

const MAX_DAYS = 36500 // 100 ans : au-delà, on n'affiche pas de date

export const walletBalance = (txs: WalletTx[]) => txs.reduce((sum, t) => sum + t.amount, 0)

/** gain net moyen par jour sur les `days` derniers jours (ou depuis le 1er mouvement) */
export function dailyRate(txs: WalletTx[], days = 30) {
  const today = todayStr()
  const past = txs.filter((t) => t.date <= today)
  if (past.length === 0) return 0

  const windowStart = format(subDays(new Date(), days - 1), 'yyyy-MM-dd')
  const first = past.reduce((min, t) => (t.date < min ? t.date : min), past[0].date)
  const from = first > windowStart ? first : windowStart

    const span = Math.max(differenceInCalendarDays(new Date(), parseISO(from)) + 1, 7)
  const net = past.filter((t) => t.date >= from).reduce((sum, t) => sum + t.amount, 0)
  return net / Math.max(span, 1)
}

/** solde jour par jour sur les n derniers jours */
export function balanceSeries(txs: WalletTx[], n = 30) {
  const today = new Date()
  const startStr = format(subDays(today, n - 1), 'yyyy-MM-dd')
  let balance = txs.filter((t) => t.date < startStr).reduce((sum, t) => sum + t.amount, 0)

  return Array.from({ length: n }, (_, i) => {
    const d = subDays(today, n - 1 - i)
    const ds = format(d, 'yyyy-MM-dd')
    balance += txs.filter((t) => t.date === ds).reduce((sum, t) => sum + t.amount, 0)
    return { label: format(d, 'd MMM', { locale: fr }), solde: balance }
  })
}

/** temps nécessaire pour mettre `remaining` Ar de côté à `perDay` Ar par jour */
export function estimateWithRate(
  remaining: number,
  perDay: number,
): { days: number | null; date: Date | null } {
  if (remaining <= 0) return { days: 0, date: new Date() }
  if (perDay <= 0) return { days: null, date: null }
  const days = Math.ceil(remaining / perDay)
  return { days, date: days <= MAX_DAYS ? addDays(new Date(), days) : null }
}

export function humanDays(days: number) {
  if (days <= 0) return 'dès maintenant'
  if (days > MAX_DAYS) return 'plus de 100 ans'
  if (days === 1) return '1 jour'
  if (days < 14) return `${days} jours`
  if (days < 60) return `${Math.round(days / 7)} semaines`
  if (days < 730) return `${Math.round(days / 30.44)} mois`
  const months = Math.round(days / 30.44)
  const years = Math.floor(months / 12)
  const rest = months % 12
  return `${years} ans${rest ? ` et ${rest} mois` : ''}`
}

export function goalEstimate(goal: Goal, balance: number, rate: number) {
  const share = goal.percent / 100
  const allocated = Math.max(balance, 0) * share // argent réservé à cet objectif
  const goalRate = rate * share // gain par jour qui revient à cet objectif

  const remaining = Math.max(goal.target - allocated, 0)
  const progress = goal.target > 0 ? Math.min(allocated / goal.target, 1) : 0
  const done = remaining === 0
  const { days, date } = estimateWithRate(remaining, goalRate)

  let neededPerDay: number | null = null
  let overdue = false
  if (goal.deadline && !done) {
    const left = differenceInCalendarDays(parseISO(goal.deadline), new Date())
    if (left > 0) neededPerDay = remaining / left
    else overdue = true
  }

  return { allocated, goalRate, remaining, progress, done, days, date, neededPerDay, overdue, share }
}