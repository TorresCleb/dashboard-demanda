'use client'

import useSWR from 'swr'
import { fetchDemanda } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DemandaBadge } from './demanda-badge'
import { AlertTriangle, Calendar, Clock, User } from 'lucide-react'

interface DemandaDetailDialogProps {
  demandaId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DemandaDetailDialog({
  demandaId,
  open,
  onOpenChange,
}: DemandaDetailDialogProps) {
  const {
    data: demanda,
    error,
    isLoading,
  } = useSWR(demandaId ? ['demanda', demandaId] : null, () =>
    demandaId ? fetchDemanda(demandaId) : null
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhes da Demanda
            {demanda?.urgente && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Urgente
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {demandaId ? `Demanda #${demandaId}` : 'Carregando...'}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <p className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error.message || 'Erro ao carregar detalhes da demanda'}
            </p>
          </div>
        )}

        {demanda && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="font-medium text-foreground">
                  {demanda.tecnico}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {demanda.data}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {demanda.hora}
              </div>
              <DemandaBadge tipo={demanda.tipo} />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Resumo
              </h4>
              <p className="text-sm">{demanda.resumo}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Mensagem Original (WhatsApp)
              </h4>
              <div className="rounded-lg bg-muted p-4">
                <p className="whitespace-pre-wrap text-sm">{demanda.mensagem}</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
