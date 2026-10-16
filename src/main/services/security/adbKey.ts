// ADB RSA anahtar yönetimi (prompt 143) + parmak izi (prompt 141).
// Anahtar üretimi, okunması, rotasyonu ve silinmesi; fingerprint hesabı.
// Saf Node + adb binary (keygen) — headless test edilebilir.
import { createHash, generateKeyPairSync } from 'crypto'
import { homedir, hostname, userInfo } from 'os'
import { join } from 'path'
import { existsSync, promises as fs } from 'fs'
import type { AdbKeyInfo } from '@shared/types'
import { adbExec } from '../adb/exec'

// adb varsayılan anahtar konumu: ~/.android/adbkey
export function getKeyDir(): string {
  return join(homedir(), '.android')
}

export function getKeyPaths(): { privatePath: string; publicPath: string } {
  const dir = getKeyDir()
  return { privatePath: join(dir, 'adbkey'), publicPath: join(dir, 'adbkey.pub') }
}

export function keyExists(): boolean {
  const { privatePath, publicPath } = getKeyPaths()
  return existsSync(privatePath) && existsSync(publicPath)
}

// Anahtar dosyasındaki yorum (adb `user@host` biçimini kullanır).
function keyComment(): string {
  try {
    return `${userInfo().username}@${hostname()}`
  } catch {
    return 'telefon@yerel'
  }
}

// --- DER (PKCS#1 RSAPublicKey) kodlama: adb'nin beklediği public key blob'u ---

function derLength(len: number): Buffer {
  if (len < 0x80) return Buffer.from([len])
  const bytes: number[] = []
  let l = len
  while (l > 0) {
    bytes.unshift(l & 0xff)
    l >>>= 8
  }
  return Buffer.from([0x80 | bytes.length, ...bytes])
}

function derInteger(num: Buffer): Buffer {
  let b = num
  while (b.length > 1 && b[0] === 0) b = b.subarray(1)
  const content = b[0] & 0x80 ? Buffer.concat([Buffer.from([0]), b]) : b
  return Buffer.concat([Buffer.from([0x02]), derLength(content.length), content])
}

function derSequence(content: Buffer): Buffer {
  return Buffer.concat([Buffer.from([0x30]), derLength(content.length), content])
}

// JWK (n, e) -> PKCS#1 DER (RSAPublicKey).
function jwkToRsaPublicDer(jwk: { n: string; e: string }): Buffer {
  const n = Buffer.from(jwk.n, 'base64url')
  const e = Buffer.from(jwk.e, 'base64url')
  return derSequence(Buffer.concat([derInteger(n), derInteger(e)]))
}

// --- parmak izi ---

function toColonHex(buf: Buffer): string {
  return buf.toString('hex').toUpperCase().match(/.{2}/g)?.join(':') ?? ''
}

// adb'nin gösterdiği parmak izi: public key blob'unun MD5'i (colon'lu hex).
export function fingerprintMd5(publicDer: Buffer): string {
  return toColonHex(createHash('md5').update(publicDer).digest())
}

export function fingerprintSha256(publicDer: Buffer): string {
  return toColonHex(createHash('sha256').update(publicDer).digest())
}

// adbkey.pub dosyasındaki blob'u (base64) çözer.
export async function readPublicKeyBlob(publicPath: string): Promise<Buffer> {
  const raw = await fs.readFile(publicPath, 'utf8')
  const firstToken = raw.split(/\s+/)[0] ?? ''
  return Buffer.from(firstToken, 'base64')
}

// --- üretim ---

// Node crypto ile geçerli bir adb anahtar çifti üretir (fallback; adb kurulu değilse).
async function generateWithNode(): Promise<void> {
  const { privatePath, publicPath } = getKeyPaths()
  await fs.mkdir(getKeyDir(), { recursive: true })

  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })

  // Özel anahtar: PKCS#8 PEM (adb keygen'in yazdığı biçimle aynı).
  const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' })
  await fs.writeFile(privatePath, privatePem, { mode: 0o600 })

  // Açık anahtar: PKCS#1 DER -> base64 + " user@host" (adbkey.pub biçimi).
  const jwk = publicKey.export({ format: 'jwk' }) as { n: string; e: string }
  const der = jwkToRsaPublicDer(jwk)
  await fs.writeFile(publicPath, `${der.toString('base64')} ${keyComment()}\n`, {
    mode: 0o644
  })
}

// adb binary'si ile anahtar üretmeyi dener; başarısızsa Node fallback'e geçer.
async function generateWithAdb(): Promise<boolean> {
  try {
    const { privatePath } = getKeyPaths()
    await fs.mkdir(getKeyDir(), { recursive: true })
    // `adb keygen <dosya>` -> <dosya> + <dosya>.pub üretir.
    await adbExec(['keygen', privatePath])
    return true
  } catch {
    return false
  }
}

// Anahtar yoksa otomatik üretir; bilgi döndürür (prompt 143).
export async function ensureAdbKey(): Promise<AdbKeyInfo> {
  if (keyExists()) return getAdbKeyInfo()
  const viaAdb = await generateWithAdb()
  if (!viaAdb) await generateWithNode()
  return getAdbKeyInfo()
}

// Anahtar hakkında bilgi toplar (parmak izleri dahil, prompt 141).
export async function getAdbKeyInfo(): Promise<AdbKeyInfo> {
  const { privatePath, publicPath } = getKeyPaths()
  const exists = keyExists()
  if (!exists) {
    return {
      exists: false,
      keyDir: getKeyDir(),
      privatePath,
      publicPath,
      fingerprintMd5: null,
      fingerprintSha256: null,
      comment: null
    }
  }
  const blob = await readPublicKeyBlob(publicPath)
  return {
    exists: true,
    keyDir: getKeyDir(),
    privatePath,
    publicPath,
    fingerprintMd5: fingerprintMd5(blob),
    fingerprintSha256: fingerprintSha256(blob),
    comment: keyComment()
  }
}

// Anahtarı yedekleyip yenisiyle değiştirir (prompt 143: yönetim).
export async function rotateAdbKey(): Promise<AdbKeyInfo> {
  const { privatePath, publicPath } = getKeyPaths()
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  if (existsSync(privatePath)) {
    await fs.rename(privatePath, `${privatePath}.bak-${stamp}`).catch(() => {})
  }
  if (existsSync(publicPath)) {
    await fs.rename(publicPath, `${publicPath}.bak-${stamp}`).catch(() => {})
  }
  const viaAdb = await generateWithAdb()
  if (!viaAdb) await generateWithNode()
  return getAdbKeyInfo()
}

// Anahtarı siler; silinen dosya sayısını döndürür.
export async function deleteAdbKey(): Promise<boolean> {
  const { privatePath, publicPath } = getKeyPaths()
  let removed = false
  for (const p of [privatePath, publicPath]) {
    if (existsSync(p)) {
      await fs.unlink(p)
      removed = true
    }
  }
  return removed
}
