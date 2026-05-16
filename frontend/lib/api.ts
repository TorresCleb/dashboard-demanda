import type { Resumo, Demanda } from './types'

// API Express (backend). Em dev: backend na 3000, front na 3001.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export async function fetchResumo(): Promise<Resumo> {
  const res = await fetch(`${API_URL}/resumo`)
  if (!res.ok) {
    throw new Error('Erro ao carregar resumo')
  }
  return res.json()
}

export async function fetchDemandas(params?: {
  tipo?: string
  busca?: string
}): Promise<Demanda[]> {
  const searchParams = new URLSearchParams()
  if (params?.tipo) searchParams.set('tipo', params.tipo)
  if (params?.busca) searchParams.set('busca', params.busca)

  const queryString = searchParams.toString()
  const url = `${API_URL}/demandas${queryString ? `?${queryString}` : ''}`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Erro ao carregar demandas')
  }
  return res.json()
}

export async function fetchDemanda(id: number): Promise<Demanda> {
  const res = await fetch(`${API_URL}/demandas/${id}`)
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Demanda não encontrada')
    }
    throw new Error('Erro ao carregar demanda')
  }
  return res.json()
}

export async function deleteDemanda(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/demandas/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Demanda não encontrada')
    }
    throw new Error('Erro ao excluir demanda')
  }
}
