import { Badge } from '@/components/ui/badge'
import type { TipoDemanda } from '@/lib/types'

const tipoBadgeStyles: Record<TipoDemanda, string> = {
  CTO: 'bg-chart-1/20 text-chart-1 hover:bg-chart-1/30',
  Splitter: 'bg-chart-2/20 text-chart-2 hover:bg-chart-2/30',
  Fusão: 'bg-chart-3/20 text-chart-3 hover:bg-chart-3/30',
  Estrutura: 'bg-chart-4/20 text-chart-4 hover:bg-chart-4/30',
}

interface DemandaBadgeProps {
  tipo: TipoDemanda
}

export function DemandaBadge({ tipo }: DemandaBadgeProps) {
  return (
    <Badge variant="secondary" className={tipoBadgeStyles[tipo]}>
      {tipo}
    </Badge>
  )
}
