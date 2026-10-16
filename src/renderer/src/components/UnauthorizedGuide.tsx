import { useEffect, useState } from 'react'
import { useAdbStore } from '../store/useAdbStore'

// Yetkisiz cihaz rehberi (prompt 142): cihaz "unauthorized" durumundayken gösterilir.
export default function UnauthorizedGuide() {
  const [serials, setSerials] = useState<string[]>([])
  const serverYenidenBaslat = useAdbStore((s) => s.serverYenidenBaslat)

  const tara = async () => {
    try {
      setSerials(await window.api.listUnauthorized())
    } catch {
      setSerials([])
    }
  }

  useEffect(() => {
    void tara()
    const id = setInterval(() => void tara(), 3000)
    return () => clearInterval(id)
  }, [])

  if (serials.length === 0) return null

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-700/60 dark:bg-amber-900/20">
      <div className="font-medium text-amber-800 dark:text-amber-300">
        Cihaz yetkili değil ({serials.length})
      </div>
      <p className="mt-1 text-amber-700 dark:text-amber-300/80">
        Telefon bu bilgisayara henüz ADB izni vermedi. Şu adımları izleyin:
      </p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-amber-700 dark:text-amber-300/80">
        <li>Telefon ekranında “USB hata ayıklamaya izin verilsin mi?” sorusunu bekleyin.</li>
        <li>Parmak izini kontrol edip <strong>“Bu bilgisayara her zaman izin ver”</strong> deyin.</li>
        <li>Soru görünmüyorsa kabloyu çıkarıp takın; USB modunun <strong>Dosya aktarımı (MTP)</strong> olduğundan emin olun.</li>
        <li>Yine olmuyorsa <strong>Geliştirici seçenekleri → USB hata ayıklama yetkilerini iptal et</strong> deyip yeniden bağlanın.</li>
        <li>Son çare: ADB sunucusunu yeniden başlatın.</li>
      </ol>
      <div className="mt-3 flex gap-2">
        <button onClick={() => void tara()} className="btn-ghost text-xs">
          Yeniden dene
        </button>
        <button onClick={() => void serverYenidenBaslat()} className="btn-ghost text-xs">
          ADB sunucusunu yeniden başlat
        </button>
      </div>
    </div>
  )
}
