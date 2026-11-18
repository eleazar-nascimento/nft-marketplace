const blogPosts = [
  {
    id: 'blog-1',
    meta: '12 de setembro  |  Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    excerpt: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: '/images/figma/9add2.jpg',
  },
  {
    id: 'blog-2',
    meta: '13 de setembro  |  Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    excerpt: 'Conheça criadores que moldam a cultura digital.',
    image: '/images/figma/8f387.jpg',
  },
  {
    id: 'blog-3',
    meta: '15 de setembro  |  Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    excerpt: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: '/images/figma/83794.jpg',
  },
  {
    id: 'blog-4',
    meta: '15 de setembro  |  Leitura de 2 min',
    title: 'Como proteger sua carteira',
    excerpt: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: '/images/figma/b7cfc.jpg',
  },
]

export function MintJournalSection() {
  return (
    <section aria-labelledby="blog-heading" className="mt-[72px] flex flex-col items-center gap-[40px]">
      <div className="flex flex-col items-center gap-[12px] text-center">
        <h2 id="blog-heading" className="text-[28px] font-bold text-text-primary">
          Diário da Cunhagem
        </h2>
        <p className="text-[14px] text-text-secondary">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-[24px] sm:grid-cols-2 lg:grid-cols-4">
        {blogPosts.map((post) => (
          <article key={post.id} className="flex flex-col overflow-hidden rounded-[8px] bg-bg-secondary">
            <div className="h-[195px] w-full overflow-hidden">
              <img
                src={post.image}
                alt={post.title}
                width={268}
                height={195}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col justify-between gap-[8px] px-[16px] pt-[12px] pb-[16px]">
              <div className="flex flex-col gap-[8px]">
                <p className="text-[12px] font-medium leading-[16px] text-text-secondary">{post.meta}</p>
                <h3 className="text-[16px] font-bold leading-snug text-text-primary">{post.title}</h3>
                <p className="text-[12px] font-medium leading-[16px] text-text-secondary">
                  {post.excerpt}
                </p>
              </div>
              <a
                href="#catalogo-section"
                className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-accent-bright hover:underline"
              >
                <span>Ler mais</span>
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
