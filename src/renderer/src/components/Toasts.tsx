import { useToastStore, type ToastType } from '../store/useToastStore'

const stiller: Record<ToastType, string> = {
  success:
    'border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/40 dark:text-green-200',
  error:
    'border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/40 dark:text-red-200',
  info: 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
}

// Bildirim (toast) yığını (prompt 37/38).
export default function Toasts() {
  const toasts = useToastStore((s) => s.toasts)
  const remove = useToastStore((s) => s.remove)

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => remove(t.id)}
          className={`rounded-md border px-4 py-2 text-left text-sm shadow ${stiller[t.type]}`}
        >
          {t.message}
        </button>
      ))}
    </div>
  )
}
