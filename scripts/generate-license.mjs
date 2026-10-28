#!/usr/bin/env node
// Serial üretici — yalnızca lisans sahibi kullanır.
// Kullanım: node scripts/generate-license.mjs [adet]
// İmzalama için scripts/keys/secret.key gerekir (git'e girmez; kaybolursa
// yeni serial üretilemez — mevcut serialler çalışmaya devam eder).
import { createHmac, randomBytes } from 'crypto'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Uygulamadaki (src/main/services/license/index.ts) ile aynı değerler.
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const PRODUCT_BYTE = 0x11
const HMAC_BYTES = 16
const NONCE_BYTES = 3

function base32Encode(buf) {
  let bits = 0
  let value = 0
  let out = ''
  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31]
  return out
}

function group(s, n = 5) {
  return s.match(new RegExp(`.{1,${n}}`, 'g'))?.join('-') ?? s
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const keyPath = join(__dirname, 'keys', 'secret.key')

if (!existsSync(keyPath)) {
  console.error('HATA: scripts/keys/secret.key bulunamadı.')
  console.error('Anahtar üretmek için: node scripts/generate-keys.mjs')
  console.error('DİKKAT: Yeni anahtar üretmek mevcut serialleri geçersiz kılar.')
  process.exit(1)
}

const secret = readFileSync(keyPath, 'utf8').trim()
const count = Math.max(1, Number(process.argv[2] ?? 1) || 1)

for (let i = 0; i < count; i++) {
  const payload = Buffer.concat([Buffer.from([PRODUCT_BYTE]), randomBytes(NONCE_BYTES)])
  const mac = createHmac('sha256', secret).update(payload).digest().subarray(0, HMAC_BYTES)
  console.log(group(base32Encode(Buffer.concat([payload, mac]))))
}
