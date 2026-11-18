import { Link } from '@tanstack/react-router'

export function HeroBanner() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden rounded-xl bg-linear-to-br from-bg-secondary via-bg-elevated to-surface-dark p-5 lg:h-112.5 lg:rounded-none lg:bg-none lg:bg-bg-secondary/40 lg:pl-10 lg:pr-0 lg:py-0"
    >
      <div className="flex flex-col items-center justify-between gap-6 lg:h-full lg:flex-row">
        <div className="flex w-full flex-col justify-between lg:w-150">
          <div className="flex flex-col gap-6 lg:gap-8">
            <div className="flex flex-col gap-2">
              <p className="text-[12px] font-medium tracking-[1.4px] text-text-primary lg:text-[14px]">
                Bem-vindo à Kurio
              </p>
              <h1
                id="hero-heading"
                className="text-[22px] font-bold leading-7.5 text-text-primary sm:text-[34px] sm:leading-11 lg:text-[43px] lg:leading-16"
              >
                SEJA DONO DO FUTURO
                <br />
                DA ARTE DIGITAL
              </h1>
              <p className="max-w-139.25 text-[12px] leading-4.5 text-text-secondary lg:text-[14px] lg:leading-6">
                Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
                rara, apoie artistas e tenha uma parte da cultura da internet.
              </p>
            </div>

            <div>
              <a
                href="#catalogo-section"
                className="inline-flex h-10 w-35 items-center justify-center rounded-md bg-accent text-[16px] font-bold leading-5 text-bg-primary hover:bg-accent-hover"
              >
                EXPLORAR
              </a>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 lg:mt-10 lg:justify-end">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="h-2 w-2 rounded-full bg-accent/40" />
            <span className="h-2 w-2 rounded-full bg-accent/40" />
          </div>
        </div>

        <Link
          to="/nft/$nftId"
          params={{ nftId: 'nft_001' }}
          data-testid="hero-featured-card"
          className="relative block h-55 w-55 shrink-0 overflow-hidden rounded-3xl sm:h-80 sm:w-80 lg:h-112.5 lg:w-112.5"
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
    </section>
  )
}
