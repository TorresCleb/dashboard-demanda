'use client'

import useSWR from 'swr'
import { fetchResumo } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Network,
  SplitSquareVertical,
  Flame,
  Building2,
  AlertTriangle,
  LayoutDashboard,
} from 'lucide-react'

export function ResumoCards() {
  const { data: resumo, error, isLoading } = useSWR('resumo', fetchResumo)

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        <p className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Erro ao carregar resumo. Verifique se a API está disponível.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Total',
      value: resumo?.total ?? 0,
      icon: LayoutDashboard,
      className: 'bg-card',
    },
    {
      title: 'CTO',
      value: resumo?.cto ?? 0,
      icon: Network,
      className: 'bg-chart-1/10',
    },
    {
      title: 'Splitter',
      value: resumo?.splitter ?? 0,
      icon: SplitSquareVertical,
      className: 'bg-chart-2/10',
    },
    {
      title: 'Fusão',
      value: resumo?.fusao ?? 0,
      icon: Flame,
      className: 'bg-chart-3/10',
    },
    {
      title: 'Estrutura',
      value: resumo?.estrutura ?? 0,
      icon: Building2,
      className: 'bg-chart-4/10',
    },
    {
      title: 'Urgentes',
      value: resumo?.urgentes ?? 0,
      icon: AlertTriangle,
      className: 'bg-destructive/10',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.title} className={card.className}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon
              className={`h-4 w-4 ${card.title === 'Urgentes' ? 'text-destructive' : 'text-muted-foreground'}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${card.title === 'Urgentes' && card.value > 0 ? 'text-destructive' : ''}`}
            >
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
