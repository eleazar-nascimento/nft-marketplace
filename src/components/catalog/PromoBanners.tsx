import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

export function PromoBanners() {
  return (
    <section aria-label="Coleções em destaque" className="mt-[72px] grid grid-cols-1 gap-[28px] lg:grid-cols-2">
      <div className="flex flex-col items-center justify-between overflow-hidden rounded-[12px] bg-bg-secondary sm:h-[250px] sm:flex-row">
        <img
          src="/images/figma/8f387.jpg"
          alt="Lançamentos gênesis de edição limitada"
          width={280}
          height={250}
          loading="lazy"
          className="h-[220px] w-full rounded-[12px] object-cover sm:h-[250px] sm:w-[270px]"
        />
        <div className="flex flex-1 flex-col items-end justify-center gap-3 p-6 text-right">
          <h2 className="text-[18px] font-bold leading-[24px] text-text-primary">
            Lançamentos gênesis
            <br />
            de edição limitada
          </h2>
          <p className="text-[14px] leading-[22px] text-text-secondary">
            Colecione edições escassas diretamente dos criadores antes da revelação pública.
          </p>
          <Link
            to="/nft/$nftId"
            params={{ nftId: 'nft_001' }}
            className="inline-flex h-[40px] items-center gap-2 rounded-[6px] bg-accent px-5 text-[14px] font-bold text-bg-primary hover:bg-accent-hover"
          >
            <span>Explorar</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between overflow-hidden rounded-[12px] bg-bg-secondary sm:h-[250px] sm:flex-row">
        <img
          src="/images/figma/9add2.jpg"
          alt="Arte digital selecionada e muito mais"
          width={280}
          height={250}
          loading="lazy"
          className="h-[220px] w-full rounded-[12px] object-cover sm:h-[250px] sm:w-[270px]"
        />
        <div className="flex flex-1 flex-col items-end justify-center gap-3 p-6 text-right">
          <h2 className="text-[18px] font-bold leading-[24px] text-text-primary">
            Arte digital selecionada
            <br />e muito mais
          </h2>
          <p className="text-[14px] leading-[22px] text-text-secondary">
            Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.
          </p>
          <Link
            to="/nft/$nftId"
            params={{ nftId: 'nft_003' }}
            className="inline-flex h-[40px] items-center gap-2 rounded-[6px] bg-accent px-5 text-[14px] font-bold text-bg-primary hover:bg-accent-hover"
          >
            <span>Explorar</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
