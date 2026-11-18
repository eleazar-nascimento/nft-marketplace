import { Skeleton } from '@/components/ui/skeleton'

export function NftDetailSkeleton() {
  return (
    <div
      data-testid="nft-detail-skeleton"
      className="mx-auto min-h-220 w-full max-w-300 px-4 pt-6 sm:px-6 lg:px-0"
    >
      <Skeleton className="h-4 w-40 rounded-sm" />
      <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:gap-7 lg:w-143.25 lg:shrink-0">
          <div className="flex flex-row gap-3 sm:w-25 sm:flex-col sm:gap-4">
            <Skeleton className="h-19 w-19 rounded-lg sm:h-25 sm:w-25" />
            <Skeleton className="h-19 w-19 rounded-lg sm:h-25 sm:w-25" />
            <Skeleton className="h-19 w-19 rounded-lg sm:h-25 sm:w-25" />
            <Skeleton className="h-19 w-19 rounded-lg sm:h-25 sm:w-25" />
          </div>
          <Skeleton className="aspect-square w-full rounded-md sm:h-111 sm:w-111" />
        </div>
        <div className="flex-1 space-y-5">
          <Skeleton className="h-8 w-3/4 rounded-sm" />
          <Skeleton className="h-6 w-1/2 rounded-sm" />
          <Skeleton className="h-20 w-full rounded-sm" />
          <Skeleton className="h-10 w-64 rounded-sm" />
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-sm" />
        </div>
      </div>
      <div className="mt-14 space-y-4">
        <Skeleton className="h-8 w-80 rounded-sm" />
        <Skeleton className="h-44 w-full rounded-sm" />
      </div>
    </div>
  )
}
