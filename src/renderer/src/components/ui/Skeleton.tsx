// Yükleme durumu için skeleton (prompt 79).
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${className}`} />
}

export function DeviceCardSkeleton() {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="mt-4 h-3 w-full" />
    </div>
  )
}

export default Skeleton
