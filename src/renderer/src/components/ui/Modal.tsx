import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

// Genel amaçlı modal: onay, form, bilgi (prompt 82).
export default function Modal({
  open,
  onClose,
  title,
  children,
  footer
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-surface"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {title && <h2 className="mb-3 text-lg font-semibold">{title}</h2>}
            <div>{children}</div>
            {footer && <div className="mt-4 flex justify-end gap-2">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
