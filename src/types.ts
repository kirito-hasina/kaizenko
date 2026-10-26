export type Category = 'survie' | 'optionnel' | 'culture' | 'extra'
export type Method = 'especes' | 'mvola' | 'orange' | 'airtel' | 'carte'

export interface Expense {
  id: string
  date: string // AAAA-MM-JJ
  amount: number // en Ariary
  category: Category
  label: string
  method: Method
}

export interface MonthPlan {
  income: number
  fixed: number
  savingsGoal: number
}

/** mouvement du portefeuille : amount > 0 = dépôt, amount < 0 = retrait */
export interface WalletTx {
  id: string
  date: string
  amount: number
  note: string
}

export interface Goal {
  id: string
  name: string
  target: number
  percent: number // part du portefeuille réservée à cet objectif (0 à 100)
  deadline?: string // AAAA-MM-JJ, facultatif
}

export interface Allocation {
  needs: number // % du revenu pour les besoins essentiels
  wants: number // % pour les loisirs et envies
  savings: number // % pour l'épargne (needs + wants + savings = 100)
}