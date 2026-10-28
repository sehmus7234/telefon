#!/usr/bin/env node
// Ed25519 lisans anahtar çifti üretir.
//   public.pem  -> src/main/services/license/publicKey.ts içine GÖMÜLÜR
//   private.pem -> yalnızca lisans sahibinde kalır (ASLA commit/paketlenmez)
// DİKKAT: Yeni anahtar üretmek, eski anahtarla imzalanmış tüm serialleri geçersiz kılar.
import { generateKeyPairSync } from 'crypto'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dir = join(__dirname, 'keys')
mkdirSync(dir, { recursive: true })

const { privateKey, publicKey } = generateKeyPairSync('ed25519')
writeFileSync(join(dir, 'private.pem'), privateKey.export({ type: 'pkcs8', format: 'pem' }), {
  mode: 0o600
})
writeFileSync(join(dir, 'public.pem'), publicKey.export({ type: 'spki', format: 'pem' }))

console.log('Anahtarlar üretildi:')
console.log('  scripts/keys/private.pem (gizli — kimseyle paylaşma)')
console.log(
  '  scripts/keys/public.pem  (bu içeriği src/main/services/license/publicKey.ts içine göm)'
)
console.log('')
console.log('public.pem içeriği:')
console.log(publicKey.export({ type: 'spki', format: 'pem' }))
