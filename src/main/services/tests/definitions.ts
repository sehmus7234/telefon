// Donanım testi tanımları (prompt 114-125).
// Her test: bir ADB komutu + geçme koşulu (check) + özet (summary).
export interface TestDef {
  id: string
  name: string
  args: string[]
  check?: (output: string) => boolean
  summary?: (output: string) => string
  description: string
}

export const TEST_DEFINITIONS: TestDef[] = [
  {
    id: 'screen',
    name: 'Ekran (çözünürlük)',
    args: ['shell', 'wm', 'size'],
    check: (o) => /Physical size|Override size|^\d{2,4}x\d{2,4}/m.test(o),
    summary: (o) => o.trim().split('\n')[0],
    description: 'Ekran çözünürlüğünü okur. Renk testi görsel bir uygulama gerektirir.'
  },
  {
    id: 'touch',
    name: 'Dokunmatik (getevent)',
    args: ['shell', 'getevent', '-pl'],
    check: (o) => /ABS_MT|touchscreen|touch/i.test(o),
    summary: () => 'getevent -pl: dokunmatik cihaz ve ABS_MT olayları listelendi',
    description:
      'adb shell getevent -pl giriş cihazlarını ve yeteneklerini listeler; dokunmatik ekran ABS_MT olaylarıyla görünür. Canlı izleme: adb shell getevent -l.'
  },
  {
    id: 'speaker',
    name: 'Hoparlör',
    args: ['shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', 'file:///system/media/audio/ringtones/'],
    check: () => true,
    description: 'Sistem sesini oynatır (yol cihaza göre değişebilir).'
  },
  {
    id: 'mic',
    name: 'Mikrofon',
    args: ['shell', 'am', 'start', '-a', 'android.provider.MediaStore.Audio.Media.RECORD_SOUND_ACTION'],
    check: () => true,
    description: 'Ses kaydediciyi açar; kayıt + oynatma ile doğrulanır.'
  },
  {
    id: 'camera',
    name: 'Kamera',
    args: ['shell', 'am', 'start', '-a', 'android.media.action.IMAGE_CAPTURE'],
    check: () => true,
    description: 'Kamera uygulamasını açar.'
  },
  {
    id: 'vibrate',
    name: 'Titreşim',
    args: ['shell', 'cmd', 'vibrator', 'vibrate', '500'],
    check: () => true,
    description: '500 ms titreşim tetikler.'
  },
  {
    id: 'sensor',
    name: 'Sensörler',
    args: ['shell', 'dumpsys', 'sensorservice'],
    check: (o) => /Sensor/i.test(o),
    summary: (o) => `${(o.match(/Sensor/gi) ?? []).length} sensör satırı`,
    description: 'Sensör servisi durumunu listeler.'
  },
  {
    id: 'wifi',
    name: 'Wi-Fi',
    args: ['shell', 'cmd', 'wifi', 'status'],
    check: (o) => /enabled/i.test(o),
    summary: (o) => o.trim().split('\n')[0],
    description: 'Wi-Fi durumunu gösterir.'
  },
  {
    id: 'bluetooth',
    name: 'Bluetooth',
    args: ['shell', 'cmd', 'bluetooth_manager'],
    check: (o) => o.trim().length > 0,
    description: 'Bluetooth yöneticisinin komutlarını/varlığını kontrol eder.'
  },
  {
    id: 'gps',
    name: 'GPS / Konum',
    args: ['shell', 'dumpsys', 'location'],
    check: (o) => /gps|location|provider/i.test(o),
    summary: (o) => o.trim().split('\n')[0],
    description: 'Konum sağlayıcılarının durumunu gösterir.'
  },
  {
    id: 'battery',
    name: 'Pil',
    args: ['shell', 'dumpsys', 'battery'],
    check: (o) => /level:/i.test(o),
    summary: (o) => {
      const g = (re: RegExp): string | undefined => o.match(re)?.[1]
      const temp = g(/temperature:\s*(\d+)/i)
      return `%${g(/level:\s*(\d+)/i) ?? '?'} · status ${g(/status:\s*(\d+)/i) ?? '?'} · ${
        temp ? (Number(temp) / 10).toFixed(1) + '°C' : '?'
      } · ${g(/voltage:\s*(\d+)/i) ?? '?'}mV`
    },
    description: 'Şarj durumu, sağlık, sıcaklık, voltaj okur.'
  },
  {
    id: 'usb',
    name: 'USB',
    args: ['shell', 'getprop', 'sys.usb.config'],
    check: (o) => o.trim().length > 0,
    summary: (o) => `mod: ${o.trim() || '—'} (hız /sys/devices/.../speed üzerinden)`,
    description: 'USB modunu okur; hız cihaza özel sysfs yolundan okunur.'
  }
]
