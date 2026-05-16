import { NextResponse } from 'next/server'
import { mockDemandas } from '../demandas/route'

export async function GET() {
  const resumo = {
    total: mockDemandas.length,
    cto: mockDemandas.filter((d) => d.tipo === 'CTO').length,
    splitter: mockDemandas.filter((d) => d.tipo === 'Splitter').length,
    fusao: mockDemandas.filter((d) => d.tipo === 'Fusão').length,
    estrutura: mockDemandas.filter((d) => d.tipo === 'Estrutura').length,
    urgentes: mockDemandas.filter((d) => d.urgente).length,
  }

  return NextResponse.json(resumo)
}
