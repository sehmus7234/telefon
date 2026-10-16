// Şifreli ayar deposu (prompt 147).
// Uygulama ayarları/hassas veriler diskte düz metin olarak saklanmaz;
// kullanıcı verisi altındaki rastgele bir "master key" ile AES-256-GCM şifrelenir.
import { randomBytes } from 'crypto'
import { join } from 'path'
import { existsSync, promises as fs } from 'fs'
import { encryptString, decryptString, isEncryptedBlob } from './encryption'

let masterKeyHex: string | null = null
let masterKeyPath: string | null = null

// Depoyu başlatır; master key yoksa üretir (ilk kullanımda).
export async function initSecretStore(baseDir: string): Promise<void> {
  const dir = join(baseDir, 'security')
  masterKeyPath = join(dir, 'master.key')
  await fs.mkdir(dir, { recursive: true })
  if (!existsSync(masterKeyPath)) {
    masterKeyHex = randomBytes(32).toString('hex')
    await fs.writeFile(masterKeyPath, masterKeyHex, { mode: 0o600 })
  } else {
    masterKeyHex = (await fs.readFile(masterKeyPath, 'utf8')).trim()
  }
}

// Test için: master key'i doğrudan belirle (headless doğrulama).
export function setMasterKeyForTesting(hex: string): void {
  masterKeyHex = hex
}

function requireMasterKey(): string {
  if (!masterKeyHex) throw new Error('Şifreli ayar deposu başlatılmadı.')
  return masterKeyHex
}

// Değeri master key ile şifreler.
export function encryptSecret(value: string): string {
  return encryptString(value, requireMasterKey())
}

// Şifreli değeri çözer.
export function decryptSecret(blob: string): string {
  return decryptString(blob, requireMasterKey())
}

export function isSecretEncrypted(value: string): boolean {
  return isEncryptedBlob(value)
}

export function getSecretStorePath(): string | null {
  return masterKeyPath
}
