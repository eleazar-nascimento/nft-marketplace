import { useState } from 'react'
import { networkLabels, type NftDetail } from '@/contracts'

export function NftDetailTabs({ nft }: { nft: NftDetail }) {
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details')

  return (
    <section aria-label="Informações e avaliações do NFT" className="mt-[56px]">
      <div className="flex items-center gap-[32px] border-b border-border-subtle">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`relative pb-3 text-[17px] cursor-pointer ${
            activeTab === 'details' ? 'font-bold text-accent-bright' : 'text-text-primary'
          }`}
        >
          Detalhes do NFT
          {activeTab === 'details' ? (
            <span className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-accent" />
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`relative pb-3 text-[17px] cursor-pointer ${
            activeTab === 'reviews' ? 'font-bold text-accent-bright' : 'text-text-primary'
          }`}
        >
          Avaliações de colecionadores ({nft.likes})
          {activeTab === 'reviews' ? (
            <span className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-accent" />
          ) : null}
        </button>
      </div>

      <div className="mt-6 space-y-5 text-[14px] leading-[24px] text-text-secondary">
        <p>
          {nft.name} é uma obra digital 1/50 finalizada à mão da coleção {nft.collection}. Cada atributo
          fica armazenado nos metadados do token e verificado na {networkLabels[nft.network]}. A obra
          explora identidade, movimento e luz em um mundo digital sem fronteiras.
        </p>
        <p>
          A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um
          registro permanente de procedência registrada na rede. {nft.creator.displayName} recebe 5% de
          direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.
        </p>

        <div>
          <h3 className="font-bold text-text-primary">Rede:</h3>
          <p>Cunhado na {networkLabels[nft.network]} com procedência imutável e metadados armazenados no IPFS.</p>
        </div>

        <div>
          <h3 className="font-bold text-text-primary">Contrato:</h3>
          <p>
            Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados
            compatíveis.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-text-primary">Direitos autorais:</h3>
          <p>
            {nft.contractAddress.slice(0, 6)}...{nft.contractAddress.slice(-4)} • Contrato inteligente{' '}
            {nft.tokenStandard} verificado.
          </p>
        </div>
      </div>
    </section>
  )
}
