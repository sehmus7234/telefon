// Güvenlik modülünün headless doğrulaması (prompt 141-150).
// Electron GUI olmadan, saf Node altında çalışır; esbuild ile bundle edilip `node` ile koşulur.
// Kullanım: npx esbuild scripts/security.selfcheck.ts --bundle --platform=node \
//   --format=cjs --external:better-sqlite3 --outfile=/tmp/security.selfcheck.cjs && node /tmp/security.selfcheck.cjs
import { promises as fs } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import {
  encryptString,
  decryptString,
  encryptFile,
  decryptFile,
  hashPassword,
  verifyPassword,
  isEncryptedBlob,
  maskSensitive,
  maskImei,
  maskMac,
  classifyCommand,
  ensureAdbKey,
  rotateAdbKey,
  deleteAdbKey,
  keyExists,
  getAdbKeyInfo,
  initSecretStore,
  setMasterKeyForTesting,
  encryptSecret,
  decryptSecret,
  semverLt,
  parseAdvisories,
  setMasterPassword,
  isLocked,
  lock,
  unlock
} from '../src/main/services/security'
import { initDb, setSecureSetting, getSecureSetting, deleteSecureSetting, closeDb } from '../src/main/db'

let passed = 0
let failed = 0

function check(name: string, cond: boolean): void {
  if (cond) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.log(`  ✗ ${name}`)
  }
}

async function main(): Promise<void> {
  console.log('== Şifreleme (144/145) ==')
  const secret = encryptString('çok gizli IMEI 123456789012345', 'parola123')
  check('encryptString -> şifreli blob', isEncryptedBlob(secret) && !secret.includes('gizli'))
  check('decryptString gidiş-dönüş', decryptString(secret, 'parola123') === 'çok gizli IMEI 123456789012345')
  let wrongThrows = false
  try {
    decryptString(secret, 'yanlis')
  } catch {
    wrongThrows = true
  }
  check('yanlış parola hata fırlatır', wrongThrows)

  const { salt, hash } = hashPassword('sifre')
  check('hashPassword/verifyPassword doğru', verifyPassword('sifre', salt, hash))
  check('hashPassword yanlış parola reddeder', !verifyPassword('hatali', salt, hash))

  // Dosya şifreleme
  const tmp = await fs.mkdtemp(join(tmpdir(), 'telefon-sec-'))
  const src = join(tmp, 'veri.txt')
  const enc = join(tmp, 'veri.txt.enc')
  const dec = join(tmp, 'veri-geri.txt')
  await fs.writeFile(src, 'yedek içeriği: kişiler ve sms', 'utf8')
  await encryptFile(src, enc, 'filepass')
  const encBuf = await fs.readFile(enc)
  check('encryptFile şifreli dosya üretir (başlık var)', encBuf.subarray(0, 8).toString('ascii') === 'TELFENC1')
  await decryptFile(enc, dec, 'filepass')
  check('decryptFile gidiş-dönüş', (await fs.readFile(dec, 'utf8')) === 'yedek içeriği: kişiler ve sms')

  console.log('== Maskeleme (149) ==')
  const imeiMasked = maskImei('IMEI 123456789012345 görüldü')
  check('IMEI maskelenir', imeiMasked === 'IMEI [GİZLİ] görüldü')
  check('MAC maskelenir', !maskMac('aa:bb:cc:dd:ee:ff').includes('aa:bb'))
  const kv = maskSensitive('token=abcdef123456 password="qwerty"')
  check('token/parola maskelenir', kv.includes('[GİZLİ]') && !kv.includes('abcdef123456') && !kv.includes('qwerty'))
  const serial = maskSensitive('[ro.serialno]: [ABC123XYZ]')
  check('seri no maskelenir', !serial.includes('ABC123XYZ'))

  console.log('== Tehlikeli komut (148) ==')
  check('reboot tehlikeli', classifyCommand(['reboot']).dangerous)
  check('shell rm tehlikeli', classifyCommand(['shell', 'rm', '-rf', '/sdcard']).dangerous)
  check('shell su tehlikeli', classifyCommand(['shell', 'su']).dangerous)
  check('devices -l güvenli', !classifyCommand(['devices', '-l']).dangerous)
  check('shell ls güvenli', !classifyCommand(['shell', 'ls', '/sdcard']).dangerous)
  check('push /system tehlikeli', classifyCommand(['push', 'x', '/system/x']).dangerous)

  console.log('== ADB anahtarı (141/143) ==')
  // Anahtarı gerçek ~/.android yerine geçici HOME'a yazdır.
  const fakeHome = await fs.mkdtemp(join(tmpdir(), 'telefon-home-'))
  process.env.HOME = fakeHome
  const info = await ensureAdbKey()
  check('anahtar otomatik oluştu', info.exists && keyExists())
  check('MD5 parmak izi colon-hex', /^([0-9A-F]{2}:){15}[0-9A-F]{2}$/.test(info.fingerprintMd5 ?? ''))
  check('SHA256 parmak izi colon-hex', /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(info.fingerprintSha256 ?? ''))
  const blob = await fs.readFile(info.publicPath, 'utf8')
  check('adbkey.pub base64 + yorum', /^[A-Za-z0-9+/=]+ .+@.+/.test(blob.trim()))
  const priv = await fs.readFile(info.privatePath, 'utf8')
  check('özel anahtar PKCS#8 PEM', priv.includes('BEGIN PRIVATE KEY'))
  const before = info.fingerprintMd5
  const rotated = await rotateAdbKey()
  check('rotate yeni parmak izi üretir', rotated.fingerprintMd5 !== before)
  check('delete anahtarı siler', (await deleteAdbKey()) && !keyExists())

  console.log('== Şifreli ayar + oturum (146/147) ==')
  const dbDir = await fs.mkdtemp(join(tmpdir(), 'telefon-db-'))
  await initSecretStore(dbDir)
  const db = initDb(join(dbDir, 'test.db'))
  setSecureSetting('test.ayar', 'hassas-deger-42')
  check('secure setting okunur', getSecureSetting('test.ayar') === 'hassas-deger-42')
  // Ham DB değeri şifreli olmalı (düz metin içermemeli).
  const raw = db.prepare('SELECT value FROM secure_settings WHERE key=?').get('test.ayar') as { value: string }
  check('DB düz metin saklamaz', isEncryptedBlob(raw.value) && !raw.value.includes('hassas-deger-42'))
  deleteSecureSetting('test.ayar')
  check('secure setting silinir', getSecureSetting('test.ayar') === null)

  // session.ts DB'ye bağımlı; db fonksiyonları üzerinden dolaylı doğrulama yeterli.
  // Oturum akışı: setMasterPassword -> isLocked=false; lock -> isLocked=true.
  setMasterPassword('gizli-parola')
  check('oturum açık (parola belirlendi)', !isLocked())
  lock()
  check('kilitlenir', isLocked())
  check('yanlış parola açamaz', !unlock('yanlis'))
  check('doğru parola açar', unlock('gizli-parola') && !isLocked())
  closeDb()

  console.log('== Güvenlik güncelleme (150) ==')
  check('semverLt 33.0.0 < 34.0.0', semverLt('33.0.0', '34.0.0'))
  check('semverLt eşit değil', !semverLt('34.0.0', '34.0.0'))
  const fakeJson = [
    {
      ghsa_id: 'GHSA-xxxx',
      summary: 'Electron RCE',
      severity: 'critical',
      vulnerabilities: [
        { package: { name: 'electron' }, first_patched_version: { identifier: '34.1.0' } }
      ]
    },
    {
      ghsa_id: 'GHSA-yyyy',
      summary: 'Eski sürüm sorunu',
      severity: 'high',
      vulnerabilities: [
        { package: { name: 'electron' }, first_patched_version: { identifier: '33.0.0' } }
      ]
    }
  ]
  const affected = parseAdvisories(fakeJson, '34.0.0')
  check('etkilenen bülten bulunur', affected.length === 1 && affected[0].includes('GHSA-xxxx'))
  const noneAffected = parseAdvisories(fakeJson, '34.5.0')
  check('güncel sürüm etkilenmez', noneAffected.length === 0)

  await fs.rm(tmp, { recursive: true, force: true }).catch(() => {})
  await fs.rm(fakeHome, { recursive: true, force: true }).catch(() => {})
  await fs.rm(dbDir, { recursive: true, force: true }).catch(() => {})

  console.log(`\nSonuç: ${passed} geçti, ${failed} kaldı`)
  if (failed > 0) process.exit(1)
}

void main().catch((e) => {
  console.error('Selfcheck hatası:', e)
  process.exit(1)
})
