import Database from 'better-sqlite3'
import { migrate } from './migrations'
import { encryptSecret, decryptSecret } from '../services/security/secretStore'
import type { BackupReport, BackupHistoryItem } from '@shared/types'

let db: Database.Database | null = null

export function initDb(path: string): Database.Database {
  if (db) return db
  db = new Database(path)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  migrate(db)
  return db
}

export function getDb(): Database.Database {
  if (!db) throw new Error('Veritabanı başlatılmadı')
  return db
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}

// --- repo yardımcıları (yedek geçmişi, cihaz, ayar, log) ---

export function addBackup(report: BackupReport): number {
  const r = getDb()
    .prepare(
      `INSERT INTO backups
        (device_serial, type, path, file_count, size_bytes, duration_ms, status, report, created_at, encrypted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      report.deviceSerial,
      report.types.join(','),
      report.zipPath ?? report.dir,
      report.fileCount,
      report.sizeBytes,
      report.durationMs,
      report.status,
      JSON.stringify(report),
      report.createdAt,
      report.encrypted ? 1 : 0
    )
  return Number(r.lastInsertRowid)
}

export function listBackups(limit = 100): BackupHistoryItem[] {
  return getDb()
    .prepare(
      `SELECT id, device_serial AS deviceSerial, type, path,
              file_count AS fileCount, size_bytes AS sizeBytes,
              duration_ms AS durationMs, status, created_at AS createdAt,
              encrypted AS encrypted
       FROM backups ORDER BY created_at DESC LIMIT ?`
    )
    .all(limit) as BackupHistoryItem[]
}

export function getBackupPath(id: number): string | null {
  const row = getDb().prepare('SELECT path FROM backups WHERE id = ?').get(id) as
    | { path: string }
    | undefined
  return row?.path ?? null
}

export function getBackup(id: number): { path: string; deviceSerial: string } | null {
  const row = getDb()
    .prepare('SELECT path, device_serial AS deviceSerial FROM backups WHERE id = ?')
    .get(id) as { path: string; deviceSerial: string } | undefined
  return row ?? null
}

export function deleteBackup(id: number): boolean {
  return getDb().prepare('DELETE FROM backups WHERE id = ?').run(id).changes > 0
}

export function upsertDevice(
  serial: string,
  fields: Partial<{
    name: string
    model: string
    manufacturer: string
    osVersion: string
    apiLevel: number
    connectionType: string
  }>
): void {
  getDb()
    .prepare(
      `INSERT INTO devices
        (serial, name, model, manufacturer, os_version, api_level, connection_type, last_seen_at)
       VALUES (@serial, @name, @model, @manufacturer, @osVersion, @apiLevel, @connectionType, @now)
       ON CONFLICT(serial) DO UPDATE SET
        name = COALESCE(@name, name),
        model = COALESCE(@model, model),
        manufacturer = COALESCE(@manufacturer, manufacturer),
        os_version = COALESCE(@osVersion, os_version),
        api_level = COALESCE(@apiLevel, api_level),
        connection_type = COALESCE(@connectionType, connection_type),
        last_seen_at = @now`
    )
    .run({
      serial,
      now: new Date().toISOString(),
      name: fields.name ?? null,
      model: fields.model ?? null,
      manufacturer: fields.manufacturer ?? null,
      osVersion: fields.osVersion ?? null,
      apiLevel: fields.apiLevel ?? null,
      connectionType: fields.connectionType ?? null
    })
}

export function setSetting(key: string, value: string): void {
  getDb()
    .prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    )
    .run(key, value)
}

export function getSetting(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined
  return row?.value ?? null
}

export function addLog(level: string, message: string): void {
  getDb()
    .prepare('INSERT INTO logs (level, message, created_at) VALUES (?, ?, ?)')
    .run(level, message, new Date().toISOString())
}

// --- şifreli ayar deposu (prompt 147) ---
// Değerler diske yazılmadan önce secretStore ile şifrelenir.
export function setSecureSetting(key: string, value: string): void {
  getDb()
    .prepare(
      'INSERT INTO secure_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    )
    .run(key, encryptSecret(value))
}

export function getSecureSetting(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM secure_settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined
  if (!row) return null
  return decryptSecret(row.value)
}

export function deleteSecureSetting(key: string): boolean {
  return getDb().prepare('DELETE FROM secure_settings WHERE key = ?').run(key).changes > 0
}

export function listSecureSettingKeys(): string[] {
  return (getDb().prepare('SELECT key FROM secure_settings').all() as { key: string }[]).map(
    (r) => r.key
  )
}
