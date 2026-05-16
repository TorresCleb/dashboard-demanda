import { NextResponse } from 'next/server'
import type { Demanda } from '@/lib/types'

// Mock data store (shared with resumo route for consistency)
export const mockDemandas: Demanda[] = [
  {
    id: 1,
    tecnico: 'Carlos Silva',
    mensagem: 'Pessoal, CTO da Rua das Flores 123 está com problema de sinal. Cliente reclamando de queda frequente.',
    resumo: 'CTO com problema de sinal na Rua das Flores 123',
    tipo: 'CTO',
    urgente: true,
    data: '16/05/2026',
    hora: '08:30',
  },
  {
    id: 2,
    tecnico: 'Maria Santos',
    mensagem: 'Splitter do condomínio Boa Vista precisa de manutenção. 8 clientes afetados.',
    resumo: 'Manutenção de splitter no condomínio Boa Vista',
    tipo: 'Splitter',
    urgente: false,
    data: '16/05/2026',
    hora: '09:15',
  },
  {
    id: 3,
    tecnico: 'João Pereira',
    mensagem: 'Fusão necessária na fibra principal da Av. Brasil. Rompimento detectado.',
    resumo: 'Fusão urgente na Av. Brasil - rompimento de fibra',
    tipo: 'Fusão',
    urgente: true,
    data: '16/05/2026',
    hora: '10:00',
  },
  {
    id: 4,
    tecnico: 'Ana Oliveira',
    mensagem: 'Poste da Rua Ipanema precisa de reposição. Estrutura comprometida após acidente.',
    resumo: 'Reposição de poste na Rua Ipanema',
    tipo: 'Estrutura',
    urgente: false,
    data: '15/05/2026',
    hora: '14:30',
  },
  {
    id: 5,
    tecnico: 'Pedro Costa',
    mensagem: 'CTO do prédio comercial na Rua Augusta com capacidade esgotada. Novos clientes aguardando.',
    resumo: 'CTO com capacidade esgotada na Rua Augusta',
    tipo: 'CTO',
    urgente: false,
    data: '15/05/2026',
    hora: '16:45',
  },
  {
    id: 6,
    tecnico: 'Carlos Silva',
    mensagem: 'Estrutura de passagem na Av. Paulista com ferrugem avançada. Risco de queda.',
    resumo: 'Estrutura com ferrugem na Av. Paulista - risco de queda',
    tipo: 'Estrutura',
    urgente: true,
    data: '15/05/2026',
    hora: '11:20',
  },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo')
  const busca = searchParams.get('busca')

  let filtered = [...mockDemandas]

  if (tipo) {
    filtered = filtered.filter((d) => d.tipo === tipo)
  }

  if (busca) {
    const searchLower = busca.toLowerCase()
    filtered = filtered.filter(
      (d) =>
        d.tecnico.toLowerCase().includes(searchLower) ||
        d.mensagem.toLowerCase().includes(searchLower) ||
        d.resumo.toLowerCase().includes(searchLower)
    )
  }

  return NextResponse.json(filtered)
}
