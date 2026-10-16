import type { AdbHistoryEntry } from '@shared/types'

// Son N komutu tutar (prompt 27).
const MAX_HISTORY = 50
const entries: AdbHistoryEntry[] = []
let nextId = 1

export function record(entry: Omit<AdbHistoryEntry, 'id'>): void {
  entries.push({ id: nextId++, ...entry })
  if (entries.length > MAX_HISTORY) entries.splice(0, entries.length - MAX_HISTORY)
}

export function getHistory(): AdbHistoryEntry[] {
  return [...entries]
}

export function clearHistory(): void {
  entries.length = 0
}
