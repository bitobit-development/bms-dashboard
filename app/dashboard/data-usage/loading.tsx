import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function DataUsageLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-[250px]" />
          <Skeleton className="h-5 w-[400px]" />
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

      {/* Summary Stats Skeleton */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </Card>
        ))}
      </div>

      {/* Search Skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-[300px]" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Sites Grid Skeleton */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <Skeleton className="h-3 w-24" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
