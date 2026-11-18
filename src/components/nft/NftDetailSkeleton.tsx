import { Skeleton } from '@/components/ui/skeleton'

export function NftDetailSkeleton() {
  return (
    <div
      data-testid="nft-detail-skeleton"
      className="mx-auto min-h-[880px] w-full max-w-[1200px] px-4 pt-6 sm:px-6 lg:px-0"
    >
      <Skeleton className="h-[16px] w-40 rounded-[4px]" />
      <div className="mt-4 flex flex-col gap-[32px] lg:flex-row lg:items-start">
        <div className="flex flex-col-reverse gap-[16px] sm:flex-row sm:gap-[28px] lg:w-[573px] lg:shrink-0">
          <div className="flex flex-row gap-[12px] sm:w-[100px] sm:flex-col sm:gap-[16px]">
            <Skeleton className="h-[76px] w-[76px] rounded-[8px] sm:h-[100px] sm:w-[100px]" />
            <Skeleton className="h-[76px] w-[76px] rounded-[8px] sm:h-[100px] sm:w-[100px]" />
            <Skeleton className="h-[76px] w-[76px] rounded-[8px] sm:h-[100px] sm:w-[100px]" />
            <Skeleton className="h-[76px] w-[76px] rounded-[8px] sm:h-[100px] sm:w-[100px]" />
          </div>
          <Skeleton className="aspect-square w-full rounded-[6px] sm:h-[444px] sm:w-[444px]" />
        </div>
        <div className="flex-1 space-y-5">
          <Skeleton className="h-8 w-3/4 rounded-[4px]" />
          <Skeleton className="h-6 w-1/2 rounded-[4px]" />
          <Skeleton className="h-20 w-full rounded-[4px]" />
          <Skeleton className="h-10 w-64 rounded-[4px]" />
          <Skeleton className="h-12 w-full rounded-[6px]" />
          <Skeleton className="h-24 w-full rounded-[4px]" />
        </div>
      </div>
      <div className="mt-[56px] space-y-4">
        <Skeleton className="h-8 w-80 rounded-[4px]" />
        <Skeleton className="h-44 w-full rounded-[4px]" />
      </div>
    </div>
  )
}
