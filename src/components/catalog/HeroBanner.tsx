import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

export function HeroBanner() {
  return (
    <section aria-labelledby="hero-heading" className="relative">
      <div className="relative flex min-h-47.5 flex-col justify-center overflow-hidden rounded-[30px] p-4 lg:hidden">
        <img
          src="/images/figma/mobile-hero-bg.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />

        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
              <p className="text-[12px] font-medium leading-4 text-text-primary">
                Bem-vindo à Kurio
              </p>
              <p className="text-[18px] font-bold leading-7.25 text-text-primary">
                SEJA DONO DA
                <br />
                CULTURA DIGITAL
              </p>
              <p className="text-[12px] font-normal leading-4.5 text-text-secondary">
                Descubra NFTs selecionados de criadores do mundo todo.
              </p>
              <a
                href="#catalogo-section"
                className="mt-1 inline-flex items-center gap-2 text-[12px] font-bold leading-3.5 text-accent-bright"
              >
                <span>EXPLORAR</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>

            <Link
              to="/nft/$nftId"
              params={{ nftId: 'nft_001' }}
              className="relative block h-36.5 w-34.5 shrink-0"
            >
              <img
                src="/images/figma/8f387.jpg"
                alt="Emerald Ape #042 em destaque na Kurio"
                width={138}
                height={138}
                fetchPriority="high"
                className="h-34.5 w-34.5 rounded-2xl object-cover"
              />
              <img
                src="/images/figma/83794.jpg"
                alt=""
                width={58}
                height={58}
                className="absolute left-3.5 top-22 h-14.5 w-14.5 rounded-2xl object-cover shadow-lg"
              />
            </Link>
          </div>

          <img
            src="/images/figma/hero-dots.svg"
            alt=""
            width={33}
            height={7}
            className="h-1.75 w-8.25"
          />
        </div>
      </div>

      <div className="hidden h-112.5 w-full items-center pl-10 lg:flex">
        <div className="flex w-290 items-center justify-between">
          <div className="flex w-150 flex-col items-end gap-11">
            <div className="flex w-full flex-col items-start gap-8">
              <div className="flex w-full flex-col items-start gap-1">
                <div className="flex w-full flex-col items-start gap-2 text-text-primary">
                  <p className="w-full text-[14px] font-medium leading-4 tracking-[1.4px]">
                    Bem-vindo à Kurio
                  </p>
                  <h1 id="hero-heading" className="w-full text-[43px] font-bold leading-[70px]">
                    <span className="block">SEJA DONO DO FUTURO</span>
                    <span className="block">DA ARTE DIGITAL</span>
                  </h1>
                </div>
                <p className="w-139.25 text-[14px] font-normal leading-6 text-text-secondary">
                  Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
                  rara, apoie artistas e tenha uma parte da cultura da internet.
                </p>
              </div>

              <a
                href="#catalogo-section"
                className="inline-flex h-10 w-35 items-center justify-center rounded-md bg-accent pl-7 pr-9 py-2.5 text-[16px] font-bold leading-5 text-bg-primary hover:bg-accent-hover"
              >
                EXPLORAR
              </a>
            </div>

            <img
              src="/images/figma/hero-dots.svg"
              alt=""
              width={40}
              height={8}
              className="h-2 w-10"
            />
          </div>

          <Link
            to="/nft/$nftId"
            params={{ nftId: 'nft_001' }}
            data-testid="hero-featured-card"
            className="relative block h-112.5 w-112.5 shrink-0 overflow-hidden rounded-3xl"
          >
            <img
              src="/images/figma/8f387.jpg"
              alt="Emerald Ape #042 em destaque na Kurio"
              width={450}
              height={450}
              fetchPriority="high"
              className="h-full w-full rounded-3xl object-cover"
            />
          </Link>
        </div>
      </div>
    </section>
  )
}
