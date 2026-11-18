import { Link } from '@tanstack/react-router'

export function HeroBanner() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden rounded-[12px] bg-gradient-to-br from-bg-secondary via-bg-elevated to-surface-dark p-5 lg:h-[450px] lg:rounded-none lg:bg-none lg:bg-bg-secondary/40 lg:pl-[40px] lg:pr-0 lg:py-0"
    >
      <div className="flex flex-col items-center justify-between gap-6 lg:h-full lg:flex-row">
        <div className="flex w-full flex-col justify-between lg:w-[600px]">
          <div className="flex flex-col gap-[24px] lg:gap-[32px]">
            <div className="flex flex-col gap-[8px]">
              <p className="text-[12px] font-medium tracking-[1.4px] text-text-primary lg:text-[14px]">
                Bem-vindo à Kurio
              </p>
              <h1
                id="hero-heading"
                className="text-[22px] font-bold leading-[30px] text-text-primary sm:text-[34px] sm:leading-[44px] lg:text-[43px] lg:leading-[64px]"
              >
                SEJA DONO DO FUTURO
                <br />
                DA ARTE DIGITAL
              </h1>
              <p className="max-w-[557px] text-[12px] leading-[18px] text-text-secondary lg:text-[14px] lg:leading-[24px]">
                Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
                rara, apoie artistas e tenha uma parte da cultura da internet.
              </p>
            </div>

            <div>
              <a
                href="#catalogo-section"
                className="inline-flex h-[40px] w-[140px] items-center justify-center rounded-[6px] bg-accent text-[16px] font-bold leading-[20px] text-bg-primary hover:bg-accent-hover"
              >
                EXPLORAR
              </a>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 lg:mt-10 lg:justify-end">
            <span className="h-[8px] w-[8px] rounded-full bg-accent" />
            <span className="h-[8px] w-[8px] rounded-full bg-accent/40" />
            <span className="h-[8px] w-[8px] rounded-full bg-accent/40" />
          </div>
        </div>

        <Link
          to="/nft/$nftId"
          params={{ nftId: 'nft_001' }}
          data-testid="hero-featured-card"
          className="relative block h-[220px] w-[220px] shrink-0 overflow-hidden rounded-[24px] sm:h-[320px] sm:w-[320px] lg:h-[450px] lg:w-[450px]"
        >
          <img
            src="/images/figma/8f387.jpg"
            alt="Emerald Ape #042 em destaque na Kurio"
            width={450}
            height={450}
            fetchPriority="high"
            className="h-full w-full rounded-[24px] object-cover"
          />
        </Link>
      </div>
    </section>
  )
}
