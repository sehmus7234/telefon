// Uzun işlemler için ilerleme çubuğu: yedekleme, test vb. (prompt 83).
export default function ProgressBar({
  value,
  max = 100,
  label
}: {
  value: number
  max?: number
  label?: string
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
