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
import {
  humanizeAdbError,
  humanizeError,
  withRetry,
  isNetworkError,
  initErrorLog,
  logError,
  getRecentErrors,
  readAllErrors,
  flushErrorLog,
  initPerformance,
  recordAdbCommand,
  getPerformanceMetrics,
  computeTrend,
  writeCrashReport,
  analyzeCrashes,
  exportErrorReport,
  uploadErrorReport
} from '../src/main/services/errors'
import { createServer } from 'http'
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

  console.log('== ADB hata çevirisi (152) ==')
  check('device not found dost mesaja çevrilir', humanizeAdbError('error: device not found') === 'Cihaz bulunamadı veya bağlı değil.')
  check('unauthorized dost mesaja çevrilir', humanizeAdbError('device unauthorized') === 'Cihaz yetkili değil — telefonda "USB hata ayıklamaya izin ver" onayını verin.')
  check('bilinmeyen hata aynen kalır', humanizeAdbError('garip hata xyz') === 'garip hata xyz')
  check('humanizeError Error nesnesini çevirir', humanizeError(new Error('device offline')) === 'Cihaz bulunamadı veya bağlı değil.')

  console.log('== Retry (153) ==')
  let deneme = 0
  const sonuc = await withRetry(async () => {
    deneme++
    if (deneme < 3) throw new Error('ECONNRESET')
    return 'ok'
  }, { retries: 3, baseDelayMs: 5 })
  check('ağ hatasında yeniden deneyip başarır', sonuc === 'ok' && deneme === 3)
  check('isNetworkError ECONNRESET tanır', isNetworkError(new Error('ECONNRESET')))
  check('isNetworkError HTTP 500 tanır', isNetworkError(new Error('HTTP 503')))
  let hata = false
  try {
    await withRetry(async () => {
      throw new Error('kalıcı hata')
    }, { retries: 2, baseDelayMs: 5, shouldRetry: () => false })
  } catch {
    hata = true
  }
  check('retry edilemeyen hata hemen fırlar', hata)

  console.log('== Bellek eğilimi (159) ==')
  check('düz seri kararlı', computeTrend([10, 10, 10, 10, 10]) === 'stable')
  check('artan seri büyüyor', computeTrend([10, 10, 11, 11, 12, 12]) === 'growing')
  check('keskin artış kritik', computeTrend([10, 11, 12, 14, 17, 25]) === 'critical')

  console.log('== Hata logu + rapor + çökme (154/155/160) ==')
  const errDir = await fs.mkdtemp(join(tmpdir(), 'telefon-err-'))
  initErrorLog(errDir)
  logError('error', 'test', 'bir hata oldu', 'stack satırı')
  await flushErrorLog()
  const recent = getRecentErrors()
  check('logError belleğe yazar', recent.length === 1 && recent[0].message === 'bir hata oldu')
  const all = await readAllErrors()
  check('logError dosyaya yazar', all.length === 1 && all[0].source === 'test')

  await writeCrashReport(errDir, 'uncaughtException', new Error('çökme 1'), { a: 1 })
  await writeCrashReport(errDir, 'uncaughtException', new Error('çökme 2'), { a: 2 })
  const crashSum = await analyzeCrashes(errDir)
  check('çökme analizi sayar', crashSum.count === 2 && crashSum.lastCrashAt !== null)
  check('çökme gruplaması', crashSum.topMessages.length >= 1)

  const rapor = await exportErrorReport({ baseDir: errDir, outputDir: errDir })
  check('rapor zip üretir', rapor.filePath !== null && rapor.entryCount === 1)
  check('rapor dosyası var', rapor.filePath ? (await fs.stat(rapor.filePath)).size > 0 : false)

  // 155 — endpoint'e yükleme (yerel test sunucusu ile).
  let receivedBytes = 0
  let receivedCount = 0
  const server = createServer((req, res) => {
    req.on('data', (c: Buffer) => (receivedBytes += c.length))
    req.on('end', () => {
      receivedCount++
      res.writeHead(200)
      res.end('ok')
    })
  })
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
  const addr = server.address() as { port: number }
  const upload = await uploadErrorReport({
    baseDir: errDir,
    outputDir: errDir,
    endpoint: `http://127.0.0.1:${addr.port}/report`
  })
  check('endpoint yüklemesi başarılı', upload.method === 'endpoint' && upload.delivered)
  check('sunucu multipart gövde aldı', receivedCount === 1 && receivedBytes > 100)
  await new Promise<void>((r) => server.close(() => r()))

  // GitHub issue bağlantısı üretimi.
  const gh = await uploadErrorReport({ baseDir: errDir, outputDir: errDir, githubRepo: 'patron/telefon' })
  check('github issue URL üretir', gh.method === 'github' && (gh.url ?? '').includes('issues/new'))

  console.log('== Performans (158) ==')
  initPerformance()
  recordAdbCommand(120)
  recordAdbCommand(80)
  const perf = getPerformanceMetrics()
  check('ADB komut sayacı', perf.adbCommandCount === 2)
  check('ortalama komut süresi', perf.avgAdbCommandMs === 100)
  check('uptime pozitif', perf.uptimeMs > 0)

  await fs.rm(errDir, { recursive: true, force: true }).catch(() => {})
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
