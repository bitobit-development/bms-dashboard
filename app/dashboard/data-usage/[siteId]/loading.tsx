import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function SiteDataUsageLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-[120px]" />
          <Skeleton className="h-9 w-[250px]" />
          <Skeleton className="h-5 w-[200px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-[80px]" />
          <Skeleton className="h-9 w-[80px]" />
        </div>
      </div>

      {/* Date Range Picker Skeleton */}
      <Card className="p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Skeleton className="h-9 w-[160px]" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-[130px]" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-9 w-[130px]" />
          </div>
        </div>
      </Card>

      {/* Speed Stats Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Latency Stats Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-4 grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Data Stats Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Charts Skeleton */}
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </Card>
      ))}
    </div>
  )
}
