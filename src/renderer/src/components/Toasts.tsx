import { AnimatePresence, motion } from 'framer-motion'
import { useToastStore, type ToastType } from '../store/useToastStore'

const stiller: Record<ToastType, string> = {
  success:
    'border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/40 dark:text-green-200',
  error:
    'border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/40 dark:text-red-200',
  warning:
    'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  info: 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
}

// Bildirim (toast) yığını (prompt 81).
export default function Toasts() {
  const toasts = useToastStore((s) => s.toasts)
  const remove = useToastStore((s) => s.remove)

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            onClick={() => remove(t.id)}
            className={`rounded-md border px-4 py-2 text-left text-sm shadow ${stiller[t.type]}`}
          >
            {t.message}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
