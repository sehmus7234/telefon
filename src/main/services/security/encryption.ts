// Şifreleme yardımcıları (prompt 144/145/147).
// Uygulama içi hassas veriler ve yedek dosyaları için AES-256-GCM + scrypt.
// Saf Node (electron bağımsız) — headless test edilebilir.
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash
} from 'crypto'
import { createReadStream, createWriteStream, promises as fs } from 'fs'

// Şifreli metin formatı: v1.<salt b64>.<iv b64>.<tag b64>.<cipher b64>
const MAGIC_TEXT = 'v1'
const KEY_LENGTH = 32 // AES-256
const IV_LENGTH = 12 // GCM önerilen nonce uzunluğu
const SALT_LENGTH = 16
const TAG_LENGTH = 16

// Şifreli dosya başlığı: 8 bayt magic + 16 bayt salt + 12 bayt iv = 36 bayt.
const MAGIC_FILE = Buffer.from('TELFENC1', 'ascii')
export const ENC_FILE_HEADER_LENGTH = MAGIC_FILE.length + SALT_LENGTH + IV_LENGTH

// Parola/tuzdan 32 baytlık anahtar türetir (scrypt, saldırıya dirençli KDF).
export function deriveKey(password: string | Buffer, salt: Buffer): Buffer {
  return scryptSync(password, salt, KEY_LENGTH)
}

export function randomBytesHex(length = 32): string {
  return randomBytes(length).toString('hex')
}

function splitBlob(blob: string): {
  salt: Buffer
  iv: Buffer
  tag: Buffer
  cipher: Buffer
} {
  const parts = blob.split('.')
  if (parts.length !== 5 || parts[0] !== MAGIC_TEXT) {
    throw new Error('Şifreli veri biçimi geçersiz.')
  }
  return {
    salt: Buffer.from(parts[1], 'base64'),
    iv: Buffer.from(parts[2], 'base64'),
    tag: Buffer.from(parts[3], 'base64'),
    cipher: Buffer.from(parts[4], 'base64')
  }
}

// Metni şifreler; dönen değer tek satırlık, depolanabilir bir dizedir.
export function encryptString(plaintext: string, password: string): string {
  const salt = randomBytes(SALT_LENGTH)
  const iv = randomBytes(IV_LENGTH)
  const key = deriveKey(password, salt)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [
    MAGIC_TEXT,
    salt.toString('base64'),
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64')
  ].join('.')
}

// Şifreli dizeyi çözer; parola yanlışsa hata fırlatır.
export function decryptString(blob: string, password: string): string {
  const { salt, iv, tag, cipher } = splitBlob(blob)
  const key = deriveKey(password, salt)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(cipher), decipher.final()]).toString('utf8')
}

// Bir dizenin bizim formatımızda şifreli olup olmadığını söyler (147).
export function isEncryptedBlob(value: string): boolean {
  return value.startsWith(`${MAGIC_TEXT}.`) && value.split('.').length === 5
}

// Parola hash'i (oturum için, 146): salt + scrypt hash; doğrulama timingSafeEqual.
export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = randomBytes(SALT_LENGTH)
  const hash = scryptSync(password, salt, 32)
  return { salt: salt.toString('base64'), hash: hash.toString('base64') }
}

export function verifyPassword(password: string, saltB64: string, hashB64: string): boolean {
  const salt = Buffer.from(saltB64, 'base64')
  const expected = Buffer.from(hashB64, 'base64')
  const actual = scryptSync(password, salt, expected.length)
  return timingSafeEqual(actual, expected)
}

// Bir dizenin kısa SHA-256 parmak izi (yedek bütünlük kontrolü için).
export function sha256Hex(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex')
}

// Dosyayı AES-256-GCM ile akışlı olarak şifreler (büyük yedekler için).
// Format: [magic 8B][salt 16B][iv 12B][ciphertext][tag 16B]
export async function encryptFile(srcPath: string, destPath: string, password: string): Promise<void> {
  const salt = randomBytes(SALT_LENGTH)
  const iv = randomBytes(IV_LENGTH)
  const key = deriveKey(password, salt)
  const cipher = createCipheriv('aes-256-gcm', key, iv)

  const out = createWriteStream(destPath)
  out.write(MAGIC_FILE)
  out.write(salt)
  out.write(iv)

  const src = createReadStream(srcPath)
  for await (const chunk of src) {
    out.write(cipher.update(chunk as Buffer))
  }
  out.write(cipher.final())
  out.write(cipher.getAuthTag())
  await new Promise<void>((resolve, reject) => {
    out.end(() => resolve())
    out.on('error', reject)
  })
}

// Şifreli dosyayı çözer; parola yanlışsa hata fırlatır.
export async function decryptFile(srcPath: string, destPath: string, password: string): Promise<void> {
  const size = (await fs.stat(srcPath)).size
  if (size < ENC_FILE_HEADER_LENGTH + TAG_LENGTH) {
    throw new Error('Şifreli dosya bozuk veya çok küçük.')
  }
  const header = Buffer.alloc(ENC_FILE_HEADER_LENGTH)
  const fd = await fs.open(srcPath, 'r')
  try {
    await fd.read(header, 0, ENC_FILE_HEADER_LENGTH, 0)
  } finally {
    await fd.close()
  }
  if (!header.subarray(0, MAGIC_FILE.length).equals(MAGIC_FILE)) {
    throw new Error('Şifreli dosya değil (başlık eşleşmiyor).')
  }
  const salt = header.subarray(MAGIC_FILE.length, MAGIC_FILE.length + SALT_LENGTH)
  const iv = header.subarray(
    MAGIC_FILE.length + SALT_LENGTH,
    MAGIC_FILE.length + SALT_LENGTH + IV_LENGTH
  )
  const key = deriveKey(password, salt)

  // Auth tag dosyanın son 16 baytında.
  const cipherLen = size - ENC_FILE_HEADER_LENGTH - TAG_LENGTH
  const tagBuf = Buffer.alloc(TAG_LENGTH)
  const fd2 = await fs.open(srcPath, 'r')
  try {
    await fd2.read(tagBuf, 0, TAG_LENGTH, ENC_FILE_HEADER_LENGTH + cipherLen)
  } finally {
    await fd2.close()
  }

  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tagBuf)

  const src = createReadStream(srcPath, {
    start: ENC_FILE_HEADER_LENGTH,
    end: ENC_FILE_HEADER_LENGTH + cipherLen - 1
  })
  const out = createWriteStream(destPath)
  for await (const chunk of src) {
    out.write(decipher.update(chunk as Buffer))
  }
  out.write(decipher.final())
  await new Promise<void>((resolve, reject) => {
    out.end(() => resolve())
    out.on('error', reject)
  })
}
