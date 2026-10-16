import type Database from 'better-sqlite3'

// SQLite şeması ve migration altyapısı (prompt 112/113).
export interface Migration {
  version: number
  name: string
  up: (db: Database.Database) => void
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial-schema',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS devices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          serial TEXT UNIQUE NOT NULL,
          name TEXT,
          model TEXT,
          manufacturer TEXT,
          os_version TEXT,
          api_level INTEGER,
          connection_type TEXT,
          last_seen_at TEXT
        );

        CREATE TABLE IF NOT EXISTS backups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          device_serial TEXT NOT NULL,
          type TEXT NOT NULL,
          path TEXT NOT NULL,
          file_count INTEGER DEFAULT 0,
          size_bytes INTEGER DEFAULT 0,
          duration_ms INTEGER DEFAULT 0,
          status TEXT NOT NULL,
          report TEXT,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        );

        CREATE TABLE IF NOT EXISTS logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          level TEXT NOT NULL,
          message TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_backups_device ON backups(device_serial);
        CREATE INDEX IF NOT EXISTS idx_backups_created ON backups(created_at);
      `)
    }
  },
  {
    version: 2,
    name: 'security-settings-and-encrypted-backups',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS secure_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        ALTER TABLE backups ADD COLUMN encrypted INTEGER DEFAULT 0;
      `)
    }
  }
]

// Bekleyen migration'ları sırayla, transaction içinde uygular.
export function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `)
  const applied = new Set(
    (db.prepare('SELECT version FROM schema_migrations').all() as { version: number }[]).map(
      (r) => r.version
    )
  )
  for (const m of migrations) {
    if (applied.has(m.version)) continue
    db.transaction(() => {
      m.up(db)
      db
        .prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)')
        .run(m.version, m.name, new Date().toISOString())
    })()
  }
}
