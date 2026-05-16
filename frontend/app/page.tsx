import { ResumoCards } from '@/components/resumo-cards'
import { DemandasTable } from '@/components/demandas-table'
import { Network } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center gap-3 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Network className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Painel de Demandas</h1>
            <p className="text-sm text-muted-foreground">
              Rede de Fibra Óptica
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-6 px-4 py-6">
        <section>
          <h2 className="mb-4 text-lg font-semibold">Resumo</h2>
          <ResumoCards />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Demandas</h2>
          <DemandasTable />
        </section>
      </main>
    </div>
  )
}
