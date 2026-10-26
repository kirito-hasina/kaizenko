import { useEffect, useState } from 'react'
import { useStore } from './store'
import { monthKey } from './lib'
import Shell, { MonthNav } from './components/Layout'
import type { Tab } from './components/Layout'
import Overview from './components/Overview'
import Budget from './components/Budget'
import WalletPage from './components/Wallet'
import Repartition from './components/Repartition'

const SUBTITLES: Record<Tab, string> = {
  overview: 'Garde un œil sur ton budget, ton portefeuille et tes objectifs.',
  budget: 'Planifie ton mois et note chaque dépense avec la méthode Kakeibo.',
  wallet: 'Mets de l’argent de côté, retire quand il le faut, et vise un objectif.',
  allocation: 'Donne une mission à chaque ariary : répartis ton revenu entre besoins, envies et épargne.',
}

export default function App() {
  const [tab, setTab] = useState<Tab>('overview')
  const [month, setMonth] = useState(monthKey())
    const theme = useStore((s) => s.theme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  const greeting = new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir'

  return (
    <Shell
      tab={tab}
      setTab={setTab}
      title={`${greeting} !`}
      subtitle={SUBTITLES[tab]}
      right={tab !== 'wallet' ? <MonthNav month={month} setMonth={setMonth} /> : null}
    >
      {tab === 'overview' && <Overview month={month} goTo={setTab} />}
      {tab === 'budget' && <Budget month={month} />}
      {tab === 'wallet' && <WalletPage />}
      {tab === 'allocation' && <Repartition month={month} />}
    </Shell>
  )
}