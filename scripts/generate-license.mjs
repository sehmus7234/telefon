#!/usr/bin/env node
// Serial üretici — yalnızca lisans sahibi kullanır.
// Kullanım: node scripts/generate-license.mjs [adet]
// İmzalama için scripts/keys/private.pem gerekir (git'e girmez; kaybolursa
// yeni serial üretilemez — eski serialler çalışmaya devam eder).
import { sign, randomBytes } from 'crypto'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Uygulamadaki (src/main/services/license/index.ts) ile aynı alfabe.
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

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
const keyPath = join(__dirname, 'keys', 'private.pem')

if (!existsSync(keyPath)) {
  console.error('HATA: scripts/keys/private.pem bulunamadı.')
  console.error('Anahtar üretmek için: node scripts/generate-keys.mjs')
  console.error('DİKKAT: Yeni anahtar üretmek mevcut serialleri geçersiz kılar.')
  process.exit(1)
}

const privateKey = readFileSync(keyPath, 'utf8')
const count = Math.max(1, Number(process.argv[2] ?? 1) || 1)

for (let i = 0; i < count; i++) {
  const nonce = randomBytes(8).toString('hex')
  const payload = `telefon.v1.${nonce}`
  const sig = sign(null, Buffer.from(payload), privateKey)
  const body = Buffer.concat([Buffer.from([Buffer.byteLength(payload)]), Buffer.from(payload), sig])
  console.log(group(base32Encode(body)))
}
