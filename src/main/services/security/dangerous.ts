// Tehlikeli ADB komutlarının sınıflandırılması (prompt 148).
// Çalıştırmadan önce kullanıcı onayı gerektiren komutları tespit eder.
// Saf fonksiyon — headless test edilebilir.

export interface DangerousCommandInfo {
  dangerous: boolean
  reason: string | null
}

// Kullanıcı onayı isteyen alt komutlar (tam eşleşme, ilk argümandan sonra).
const DANGEROUS_SUBCOMMANDS: Record<string, string> = {
  reboot: 'cihazı yeniden başlatır',
  'reboot-bootloader': 'cihazı bootloader moduna alır',
  'reboot-recovery': 'cihazı kurtarma moduna alır',
  uninstall: 'bir uygulamayı kaldırır',
  root: 'adb root yetkisi ister (cihazı root moduna geçirir)',
  unroot: 'adb root yetkisini geri alır',
  'disable-verity': 'sistem doğrulamasını devre dışı bırakır',
  'enable-verity': 'sistem doğrulamasını etkinleştirir',
  sideload: 'cihaza paket yükler',
  'wipe': 'veri silme işlemi başlatır'
}

// `adb shell ...` içindeki tehlikeli komutlar (ilk kelime kontrolü).
const DANGEROUS_SHELL: Record<string, string> = {
  su: 'root kabuğu açar',
  rm: 'dosya/klasör siler',
  'dd': 'ham disk yazma/silme yapar',
  mount: 'dosya sistemini yeniden bağlar',
  umount: 'dosya sistemini ayırır',
  mkfs: 'dosya sistemi biçimlendirir',
  reboot: 'cihazı yeniden başlatır',
  'pm': 'paket yönetimi işlemi yapar',
  'am': 'uygulama/aktivite yönetimi yapar',
  'setprop': 'sistem özelliğini değiştirir',
  'chmod': 'dosya izinlerini değiştirir',
  'chown': 'dosya sahipliğini değiştirir',
  'format': 'bölümü biçimlendirir',
  'wipe': 'veri siler',
  'kill': 'işlem öldürür'
}

// Komut satırını normalize eder: seçenekleri atlar, ilk gerçek komutu bulur.
function extractCommand(args: string[]): { cmd: string; rest: string[] } {
  let i = 0
  // `-s <serial>`, `-e`, `-d` gibi bayrakları atla.
  while (i < args.length) {
    const a = args[i]
    if (a === '-s' || a === '-t') {
      i += 2 // değeriyle birlikte atla
      continue
    }
    if (a.startsWith('-') && a !== 'shell') {
      i += 1
      continue
    }
    break
  }
  const cmd = args[i] ?? ''
  return { cmd, rest: args.slice(i + 1) }
}

// Verilen adb argümanlarının tehlikeli olup olmadığını döndürür.
export function classifyCommand(args: string[]): DangerousCommandInfo {
  if (!args || args.length === 0) return { dangerous: false, reason: null }
  const { cmd, rest } = extractCommand(args)

  // shell içindeki tehlikeli komutlar
  if (cmd === 'shell') {
    const shellCmd = rest.find((r) => !r.startsWith('-')) ?? ''
    const base = shellCmd.split('/').pop() ?? ''
    if (DANGEROUS_SHELL[base]) {
      return { dangerous: true, reason: `"adb shell ${base}" ${DANGEROUS_SHELL[base]}.` }
    }
    // `pm uninstall`, `pm clear`, `am force-stop` gibi yıkıcı alt komutlar.
    if (base === 'pm' && /\b(uninstall|clear)\b/.test(rest.join(' '))) {
      return { dangerous: true, reason: 'paket kaldırma/veri temizleme işlemi yapar.' }
    }
    if (base === 'am' && /\b(force-stop|kill)\b/.test(rest.join(' '))) {
      return { dangerous: true, reason: 'çalışan uygulamayı zorla durdurur.' }
    }
    return { dangerous: false, reason: null }
  }

  if (DANGEROUS_SUBCOMMANDS[cmd]) {
    return { dangerous: true, reason: `"adb ${cmd}" ${DANGEROUS_SUBCOMMANDS[cmd]}.` }
  }

  // push'ın sistem bölümüne yazılması tehlikelidir.
  if (cmd === 'push') {
    const dest = rest[rest.length - 1] ?? ''
    if (dest.startsWith('/system') || dest === '/' || dest.startsWith('/vendor')) {
      return { dangerous: true, reason: 'sistem bölümüne dosya yazmaya çalışır.' }
    }
  }

  return { dangerous: false, reason: null }
}
