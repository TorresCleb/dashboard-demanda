import { NextResponse } from 'next/server'
import { mockDemandas } from '../route'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const demandaId = parseInt(id, 10)
  const demanda = mockDemandas.find((d) => d.id === demandaId)

  if (!demanda) {
    return NextResponse.json({ erro: 'Demanda não encontrada' }, { status: 404 })
  }

  return NextResponse.json(demanda)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const demandaId = parseInt(id, 10)
  const index = mockDemandas.findIndex((d) => d.id === demandaId)

  if (index === -1) {
    return NextResponse.json({ erro: 'Demanda não encontrada' }, { status: 404 })
  }

  // In a real implementation, this would delete from database
  // For demo, we'll just return success (data resets on reload)
  mockDemandas.splice(index, 1)

  return NextResponse.json({ ok: true })
}
