import { Link } from '@tanstack/react-router'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <Card data-testid="route-not-found" className="p-10">
        <Compass className="mx-auto h-12 w-12 text-accent-bright" aria-hidden="true" />
        <h1 className="mt-4 text-3xl font-bold text-white">Página não encontrada (404)</h1>
        <p className="mt-2 text-sm text-text-secondary">
          O endereço acessado não corresponde a nenhuma rota disponível no NFT Marketplace.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Voltar para a página inicial</Link>
        </Button>
      </Card>
    </div>
  )
}
