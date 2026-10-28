// Makine kimliği (lisansı tek makineye bağlamak için).
// Kararlı, deterministik bir parmak izi üretir; lisans kaydı bu kimliğe bağlanır.
// Saf Node (electron bağımsız) — headless test edilebilir.
import { createHash } from 'crypto'
import { existsSync, readFileSync } from 'fs'
import { cpus, hostname, networkInterfaces, platform, arch, type NetworkInterfaceInfo } from 'os'

export function getMachineId(): string {
  const parts: string[] = [platform(), arch(), hostname()]

  // Linux: sistemin makine kimliği (en kararlı kaynak).
  if (process.platform === 'linux' && existsSync('/etc/machine-id')) {
    parts.push(readFileSync('/etc/machine-id', 'utf8').trim())
  }
  // macOS: donanım UUID'si.
  if (process.platform === 'darwin' && existsSync('/usr/sbin/ioreg')) {
    // ioreg çıktısına güvenmek yerine ana bilgisayar adını dahil etmek yeterli.
  }

  const cpu = cpus()[0]
  if (cpu?.model) parts.push(cpu.model)

  // Fiziksel ağ arayüzlerinin MAC adresleri (kararlı sıralama ile).
  const macs = Object.values(networkInterfaces())
    .flat()
    .filter((i): i is NetworkInterfaceInfo => !!i && !i.internal && i.mac !== '00:00:00:00:00:00')
    .map((i) => i.mac)
    .sort()
  if (macs.length) parts.push(macs.join(','))

  return createHash('sha256').update(parts.join('|')).digest('hex')
}
