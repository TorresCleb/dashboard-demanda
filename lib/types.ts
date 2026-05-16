export interface Resumo {
  total: number
  cto: number
  splitter: number
  fusao: number
  estrutura: number
  urgentes: number
}

export interface Demanda {
  id: number
  tecnico: string
  mensagem: string
  resumo: string
  tipo: 'CTO' | 'Splitter' | 'Fusão' | 'Estrutura'
  urgente: boolean
  data: string
  hora: string
}

export type TipoDemanda = 'CTO' | 'Splitter' | 'Fusão' | 'Estrutura'
