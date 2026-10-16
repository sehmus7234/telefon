import type { ReactNode } from 'react'

// Boş durum ekranı (prompt 80): "Henüz cihaz bağlı değil" vb.
export default function EmptyState({
  icon,
  title,
  description,
  action
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
      {icon && <div className="mb-2 text-gray-400 dark:text-gray-500">{icon}</div>}
      <p className="font-medium text-gray-700 dark:text-gray-200">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
