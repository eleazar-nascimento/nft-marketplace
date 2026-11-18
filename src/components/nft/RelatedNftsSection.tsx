import { Link } from '@tanstack/react-router'
import type { NftSummary } from '@/contracts'
import { formatEth } from '@/lib/eth'

interface RelatedNftsSectionProps {
  headingId: string
  title: string
  items: NftSummary[]
}

export function RelatedNftsSection({ headingId, title, items }: RelatedNftsSectionProps) {
  if (items.length === 0) return null

  return (
    <section aria-labelledby={headingId} className="mt-[64px]">
      <h2 id={headingId} className="text-[17px] font-bold text-accent-bright">
        {title}
      </h2>
      <div className="mt-3 h-px w-full bg-border-subtle" />
      <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <Link
            key={item.id}
            to="/nft/$nftId"
            params={{ nftId: item.id }}
            className="group flex flex-col gap-2"
          >
            <div className="flex aspect-square items-center justify-center rounded-[6px] bg-bg-secondary p-2">
              <img
                src={item.image.url}
                alt={item.image.alt}
                width={190}
                height={190}
                loading="lazy"
                className="h-full w-full rounded-[12px] object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <span className="text-[15px] text-text-primary group-hover:text-accent-bright">
              {item.name}
            </span>
            <span className="text-[16px] font-bold text-accent-bright">
              {formatEth(item.priceFromEth)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
