import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useStore } from '../store'
import { CATEGORIES, fmtAr } from '../lib'
import type { Category } from '../types'

const catKeys = Object.keys(CATEGORIES) as Category[]

function useChartColors() {
  const dark = useStore((s) => s.theme) === 'dark'
  return dark
    ? { grid: '#33333b', tick: '#9a998f', ink: '#f3f2ee', accent: '#ff4b55', tipBg: '#25252b', cursor: '#ffffff10' }
    : { grid: '#dedcd5', tick: '#77766f', ink: '#17171a', accent: '#e0141f', tipBg: '#ffffff', cursor: '#00000008' }
}
type Colors = ReturnType<typeof useChartColors>

const tooltipProps = (c: Colors) => ({
  contentStyle: { background: c.tipBg, border: `1px solid ${c.grid}`, borderRadius: 12, fontSize: 12 },
  itemStyle: { color: c.ink },
  labelStyle: { color: c.tick },
})
const axisTick = (c: Colors) => ({ fill: c.tick, fontSize: 11 })
const kFormat = (v: number | string) => `${Math.round(Number(v) / 1000)}k`

const Empty = ({ text }: { text: string }) => (
  <p className="grid h-55 place-items-center text-center text-sm text-muted">{text}</p>
)

export function CategoryDonut({ byCategory }: { byCategory: Record<Category, number> }) {
  const c = useChartColors()
  const data = catKeys
    .map((k) => ({ name: CATEGORIES[k].label, value: byCategory[k], color: CATEGORIES[k].color }))
    .filter((d) => d.value > 0)

  if (data.length === 0) return <Empty text="Ajoute une dépense pour voir la répartition." />

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip {...tooltipProps(c)} formatter={(v) => fmtAr(Number(v))} />
        <Legend wrapperStyle={{ fontSize: 12, color: c.tick }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function DailyChart({ data, budget }: { data: { day: number; cumul: number }[]; budget: number }) {
  const c = useChartColors()
  if (data.every((d) => d.cumul === 0) && budget <= 0) {
    return <Empty text="Enregistre ton plan et tes dépenses pour suivre ta progression." />
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="cumulFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.accent} stopOpacity={0.3} />
            <stop offset="100%" stopColor={c.accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={c.grid} vertical={false} />
        <XAxis dataKey="day" tick={axisTick(c)} tickLine={false} axisLine={false} />
        <YAxis
          width={40}
          tick={axisTick(c)}
          tickLine={false}
          axisLine={false}
          tickFormatter={kFormat}
          domain={[0, (max: number) => Math.max(max, budget) * 1.05]}
        />
        <Tooltip {...tooltipProps(c)} labelFormatter={(d) => `Jour ${d}`} formatter={(v) => fmtAr(Number(v))} />
        {budget > 0 && (
          <ReferenceLine
            y={budget}
            stroke={c.ink}
            strokeDasharray="4 4"
            label={{ value: 'Budget', fill: c.ink, fontSize: 11, position: 'insideTopLeft' }}
          />
        )}
        <Area type="monotone" dataKey="cumul" name="Cumul" stroke={c.accent} strokeWidth={2} fill="url(#cumulFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function TrendChart({ data }: { data: { mois: string; depense: number; budget: number }[] }) {
  const c = useChartColors()
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={c.grid} vertical={false} />
        <XAxis dataKey="mois" tick={axisTick(c)} tickLine={false} axisLine={false} />
        <YAxis width={40} tick={axisTick(c)} tickLine={false} axisLine={false} tickFormatter={kFormat} />
        <Tooltip {...tooltipProps(c)} formatter={(v) => fmtAr(Number(v))} cursor={{ fill: c.cursor }} />
        <Legend wrapperStyle={{ fontSize: 12, color: c.tick }} />
        <Bar dataKey="budget" name="Budget" fill={c.ink} radius={[6, 6, 0, 0]} />
        <Bar dataKey="depense" name="Dépensé" fill={c.accent} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function BalanceChart({ data }: { data: { label: string; solde: number }[] }) {
  const c = useChartColors()
  if (data.every((d) => d.solde === 0)) {
    return <Empty text="Fais un premier dépôt pour voir l’évolution de ton solde." />
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.ink} stopOpacity={0.18} />
            <stop offset="100%" stopColor={c.ink} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={c.grid} vertical={false} />
        <XAxis dataKey="label" tick={axisTick(c)} tickLine={false} axisLine={false} minTickGap={28} />
        <YAxis width={40} tick={axisTick(c)} tickLine={false} axisLine={false} tickFormatter={kFormat} />
        <Tooltip {...tooltipProps(c)} formatter={(v) => fmtAr(Number(v))} />
        <Area type="monotone" dataKey="solde" name="Solde" stroke={c.ink} strokeWidth={2} fill="url(#balanceFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}