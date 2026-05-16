'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { fetchDemandas } from '@/lib/api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { DemandaBadge } from './demanda-badge'
import { DemandaDetailDialog } from './demanda-detail-dialog'
import { DeleteDemandaDialog } from './delete-demanda-dialog'
import { DemandasFilters } from './demandas-filters'
import {
  AlertTriangle,
  Eye,
  Trash2,
  RefreshCw,
  Inbox,
} from 'lucide-react'
import { useDebouncedCallback } from '@/hooks/use-debounce'

export function DemandasTable() {
  const [tipo, setTipo] = useState('todos')
  const [busca, setBusca] = useState('')
  const [debouncedBusca, setDebouncedBusca] = useState('')
  const [selectedDemandaId, setSelectedDemandaId] = useState<number | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteDemandaId, setDeleteDemandaId] = useState<number | null>(null)

  const debounceBusca = useDebouncedCallback((value: string) => {
    setDebouncedBusca(value)
  }, 300)

  const handleBuscaChange = (value: string) => {
    setBusca(value)
    debounceBusca(value)
  }

  const {
    data: demandas,
    error,
    isLoading,
    mutate,
  } = useSWR(
    ['demandas', tipo === 'todos' ? '' : tipo, debouncedBusca],
    () =>
      fetchDemandas({
        tipo: tipo === 'todos' ? undefined : tipo,
        busca: debouncedBusca || undefined,
      })
  )

  const handleViewDetail = (id: number) => {
    setSelectedDemandaId(id)
    setDetailOpen(true)
  }

  const handleDeleteClick = (id: number) => {
    setDeleteDemandaId(id)
    setDeleteOpen(true)
  }

  const handleDeleted = () => {
    mutate()
  }

  if (error) {
    return (
      <div className="space-y-4">
        <DemandasFilters
          tipo={tipo}
          busca={busca}
          onTipoChange={setTipo}
          onBuscaChange={handleBuscaChange}
        />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
          <p className="mt-2 text-destructive">
            Erro ao carregar demandas. Verifique se a API está disponível.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => mutate()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DemandasFilters
        tipo={tipo}
        busca={busca}
        onTipoChange={setTipo}
        onBuscaChange={handleBuscaChange}
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Técnico</TableHead>
              <TableHead className="hidden md:table-cell">Resumo</TableHead>
              <TableHead className="w-28">Tipo</TableHead>
              <TableHead className="hidden sm:table-cell w-24">Data</TableHead>
              <TableHead className="hidden sm:table-cell w-20">Hora</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="h-4 w-14" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && demandas?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Inbox className="h-8 w-8" />
                    <p>Nenhuma demanda encontrada</p>
                    {(tipo !== 'todos' || busca) && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setTipo('todos')
                          setBusca('')
                          setDebouncedBusca('')
                        }}
                      >
                        Limpar filtros
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              demandas?.map((demanda) => (
                <TableRow
                  key={demanda.id}
                  className={
                    demanda.urgente
                      ? 'bg-destructive/5 hover:bg-destructive/10'
                      : ''
                  }
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {demanda.urgente && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                      #{demanda.id}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{demanda.tecnico}</span>
                      {demanda.urgente && (
                        <Badge
                          variant="destructive"
                          className="mt-1 w-fit sm:hidden"
                        >
                          Urgente
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-md">
                    <p className="truncate text-muted-foreground">
                      {demanda.resumo}
                    </p>
                  </TableCell>
                  <TableCell>
                    <DemandaBadge tipo={demanda.tipo} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {demanda.data}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {demanda.hora}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(demanda.id)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver detalhes</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(demanda.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <DemandaDetailDialog
        demandaId={selectedDemandaId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <DeleteDemandaDialog
        demandaId={deleteDemandaId}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
