import { Suspense, lazy } from 'react'
import type { ComponentProps } from 'react'

const Donut = lazy(() => import('./Charts').then((m) => ({ default: m.CategoryDonut })))
const Daily = lazy(() => import('./Charts').then((m) => ({ default: m.DailyChart })))
const Trend = lazy(() => import('./Charts').then((m) => ({ default: m.TrendChart })))
const Balance = lazy(() => import('./Charts').then((m) => ({ default: m.BalanceChart })))

const Skeleton = () => <div className="h-55 animate-pulse rounded-2xl bg-surface" />

export const CategoryDonut = (p: ComponentProps<typeof Donut>) => (
  <Suspense fallback={<Skeleton />}><Donut {...p} /></Suspense>
)
export const DailyChart = (p: ComponentProps<typeof Daily>) => (
  <Suspense fallback={<Skeleton />}><Daily {...p} /></Suspense>
)
export const TrendChart = (p: ComponentProps<typeof Trend>) => (
  <Suspense fallback={<Skeleton />}><Trend {...p} /></Suspense>
)
export const BalanceChart = (p: ComponentProps<typeof Balance>) => (
  <Suspense fallback={<Skeleton />}><Balance {...p} /></Suspense>
)