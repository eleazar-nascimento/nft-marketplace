import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

interface OutOfScopeDialogProps {
  featureName: string | null
  onClose: () => void
}

export function OutOfScopeDialog({ featureName, onClose }: OutOfScopeDialogProps) {
  return (
    <Dialog open={Boolean(featureName)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-testid="out-of-scope-dialog">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/20 text-accent-bright">
            <Info className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <DialogTitle>Funcionalidade fora do escopo</DialogTitle>
            <DialogDescription className="mt-2">
              A seção <strong>{featureName}</strong> é um item editorial ou auxiliar do layout e não faz parte
              do escopo funcional desta entrega. Os fluxos ativos são descoberta no catálogo, detalhes do NFT,
              favoritos, carrinho, pagamento, confirmação, autenticação, perfil e carteiras.
            </DialogDescription>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Entendi</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
