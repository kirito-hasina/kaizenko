import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Allocation, Expense, Goal, MonthPlan, WalletTx } from './types'

type State = {
  theme: 'light' | 'dark'
  plans: Record<string, MonthPlan>
  expenses: Expense[]
  walletTxs: WalletTx[]
  goals: Goal[]
  allocations: Record<string, Allocation>
  setAllocation: (month: string, a: Allocation) => void
  toggleTheme: () => void
  setPlan: (month: string, plan: MonthPlan) => void
  addExpense: (e: Omit<Expense, 'id'>) => void
  updateExpense: (id: string, data: Omit<Expense, 'id'>) => void
  removeExpense: (id: string) => void
  addTx: (t: Omit<WalletTx, 'id'>) => void
  removeTx: (id: string) => void
  addGoal: (g: Omit<Goal, 'id'>) => void
  setGoalPercent: (id: string, percent: number) => void
  distributeGoals: () => void
  removeGoal: (id: string) => void
}

const usedPercent = (goals: Goal[]) => goals.reduce((sum, g) => sum + g.percent, 0)

export const useStore = create<State>()(
  persist(
    (set) => ({
      theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      plans: {},
      expenses: [],
      walletTxs: [],
      goals: [],
      allocations: {},
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setAllocation: (month, a) => set((s) => ({ allocations: { ...s.allocations, [month]: a } })),
      setPlan: (month, plan) => set((s) => ({ plans: { ...s.plans, [month]: plan } })),
      addExpense: (e) =>
        set((s) => ({ expenses: [{ ...e, id: crypto.randomUUID() }, ...s.expenses] })),
      updateExpense: (id, data) =>
        set((s) => ({ expenses: s.expenses.map((x) => (x.id === id ? { ...data, id } : x)) })),
      removeExpense: (id) => set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) })),
      addTx: (t) => set((s) => ({ walletTxs: [{ ...t, id: crypto.randomUUID() }, ...s.walletTxs] })),
      removeTx: (id) => set((s) => ({ walletTxs: s.walletTxs.filter((x) => x.id !== id) })),

      // un objectif ne peut jamais dépasser la part encore libre (total ≤ 100 %)
      addGoal: (g) =>
        set((s) => {
          const free = 100 - usedPercent(s.goals)
          const percent = Math.max(0, Math.min(Math.round(g.percent), free))
          return { goals: [...s.goals, { ...g, percent, id: crypto.randomUUID() }] }
        }),
      setGoalPercent: (id, percent) =>
        set((s) => {
          const others = usedPercent(s.goals.filter((g) => g.id !== id))
          const p = Math.max(0, Math.min(Math.round(percent), 100 - others))
          return { goals: s.goals.map((g) => (g.id === id ? { ...g, percent: p } : g)) }
        }),
      distributeGoals: () =>
        set((s) => {
          const n = s.goals.length
          if (n === 0) return s
          const base = Math.floor(100 / n)
          let extra = 100 - base * n
          return { goals: s.goals.map((g) => ({ ...g, percent: base + (extra-- > 0 ? 1 : 0) })) }
        }),
      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((x) => x.id !== id) })),
    }),
    {
      name: 'kaizenko-v1',
      version: 1,
      // anciens objectifs (sans pourcentage) : on répartit à parts égales
      migrate: (persisted, version) => {
        const s = persisted as Partial<State>
        if (version < 1 && Array.isArray(s.goals) && s.goals.length > 0) {
          const share = Math.floor(100 / s.goals.length)
          s.goals = s.goals.map((g) => ({ ...g, percent: typeof g.percent === 'number' ? g.percent : share }))
        }
        return s as State
      },
    },
  ),
)