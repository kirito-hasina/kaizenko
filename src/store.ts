import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Expense, Goal, MonthPlan, WalletTx } from './types'

type State = {
  theme: 'light' | 'dark'
  plans: Record<string, MonthPlan>
  expenses: Expense[]
  walletTxs: WalletTx[]
  goals: Goal[]
  toggleTheme: () => void
  setPlan: (month: string, plan: MonthPlan) => void
  addExpense: (e: Omit<Expense, 'id'>) => void
  updateExpense: (id: string, data: Omit<Expense, 'id'>) => void
  removeExpense: (id: string) => void
  addTx: (t: Omit<WalletTx, 'id'>) => void
  removeTx: (id: string) => void
  addGoal: (g: Omit<Goal, 'id'>) => void
  removeGoal: (id: string) => void
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      // au premier lancement : on suit le réglage du système
      theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      plans: {},
      expenses: [],
      walletTxs: [],
      goals: [],
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setPlan: (month, plan) => set((s) => ({ plans: { ...s.plans, [month]: plan } })),
      addExpense: (e) =>
        set((s) => ({ expenses: [{ ...e, id: crypto.randomUUID() }, ...s.expenses] })),
      updateExpense: (id, data) =>
        set((s) => ({ expenses: s.expenses.map((x) => (x.id === id ? { ...data, id } : x)) })),
      removeExpense: (id) => set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) })),
      addTx: (t) => set((s) => ({ walletTxs: [{ ...t, id: crypto.randomUUID() }, ...s.walletTxs] })),
      removeTx: (id) => set((s) => ({ walletTxs: s.walletTxs.filter((x) => x.id !== id) })),
      addGoal: (g) => set((s) => ({ goals: [...s.goals, { ...g, id: crypto.randomUUID() }] })),
      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((x) => x.id !== id) })),
    }),
    { name: 'kaizenko-v1' },
  ),
)