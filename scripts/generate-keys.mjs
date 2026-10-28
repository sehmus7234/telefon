#!/usr/bin/env node
// Lisans HMAC imza anahtarı üretir.
//   scripts/keys/secret.key -> yalnızca lisans sahibinde kalır (ASLA commit edilmez)
//   Aynı değer src/main/services/license/secret.ts içine gömülür (uygulama doğrulaması).
// DİKKAT: Yeni anahtar üretmek, eski anahtarla imzalanmış tüm serialleri geçersiz kılar.
import { randomBytes } from 'crypto'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dir = join(__dirname, 'keys')
mkdirSync(dir, { recursive: true })

const secret = randomBytes(32).toString('hex')
writeFileSync(join(dir, 'secret.key'), secret, { mode: 0o600 })

console.log('Anahtar üretildi: scripts/keys/secret.key (gizli — kimseyle paylaşma)')
console.log('')
console.log('Bu değeri src/main/services/license/secret.ts içindeki LICENSE_SECRET olarak göm:')
console.log(secret)
