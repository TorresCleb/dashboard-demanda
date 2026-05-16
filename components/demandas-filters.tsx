'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DemandasFiltersProps {
  tipo: string
  busca: string
  onTipoChange: (tipo: string) => void
  onBuscaChange: (busca: string) => void
}

export function DemandasFilters({
  tipo,
  busca,
  onTipoChange,
  onBuscaChange,
}: DemandasFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por técnico, mensagem ou resumo..."
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          className="pl-10"
        />
        {busca && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
            onClick={() => onBuscaChange('')}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Limpar busca</span>
          </Button>
        )}
      </div>
      <Select value={tipo} onValueChange={onTipoChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Filtrar por tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os tipos</SelectItem>
          <SelectItem value="CTO">CTO</SelectItem>
          <SelectItem value="Splitter">Splitter</SelectItem>
          <SelectItem value="Fusão">Fusão</SelectItem>
          <SelectItem value="Estrutura">Estrutura</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
