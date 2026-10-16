// Çıktıyı satır satır ayırıp diziye çevirir (prompt 21).
export function lines(output: string): string[] {
  return output
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
}

export interface ParsedAdbDevice {
  serial: string
  state: string
  attrs: Record<string, string>
}

// `adb devices -l` çıktısını ayrıştırır.
export function parseDevices(output: string): ParsedAdbDevice[] {
  const devices: ParsedAdbDevice[] = []
  for (const line of lines(output)) {
    if (line.startsWith('List of devices') || line.startsWith('* daemon')) continue
    const [serial, state, ...rest] = line.split(/\s+/)
    if (!serial || !state) continue
    const attrs: Record<string, string> = {}
    for (const part of rest) {
      const idx = part.indexOf(':')
      if (idx > 0) attrs[part.slice(0, idx)] = part.slice(idx + 1)
    }
    devices.push({ serial, state, attrs })
  }
  return devices
}

// `adb version` ilk satırından sürümü ayıklar: "Android Debug Bridge version 1.0.41"
export function parseVersion(output: string): string {
  const first = lines(output)[0] ?? ''
  const m = first.match(/version\s+(\S+)/i)
  return m?.[1] ?? first
}
