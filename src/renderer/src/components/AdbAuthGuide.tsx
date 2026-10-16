import { useEffect, useState } from 'react'
import type { AdbKeyInfo } from '@shared/types'

// ADB yetkilendirme rehberi (prompt 141): RSA anahtar süreci + parmak izi.
export default function AdbAuthGuide() {
  const [info, setInfo] = useState<AdbKeyInfo | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [mesgul, setMesgul] = useState(false)

  const yukle = async () => {
    setMesgul(true)
    setHata(null)
    try {
      // Anahtar yoksa otomatik oluşturulur (143), sonra bilgi döner.
      setInfo(await window.api.ensureAdbKey())
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e))
    } finally {
      setMesgul(false)
    }
  }

  useEffect(() => {
    void yukle()
  }, [])

  const yenile = async () => {
    setInfo(await window.api.rotateAdbKey())
  }

  const sil = async () => {
    await window.api.deleteAdbKey()
    setInfo(await window.api.getAdbKeyInfo())
  }

  return (
    <section className="card space-y-3 p-5">
      <h2 className="font-semibold">ADB yetkilendirmesi (RSA parmak izi)</h2>

      <p className="text-sm text-gray-600 dark:text-gray-300">
        ADB, bilgisayar ile telefon arasında bir <strong>RSA anahtar çifti</strong> kullanır.
        Bilgisayar özel anahtarı kendinde tutar; cihaz ilk bağlantıda bilgisayarın{' '}
        <strong>açık anahtarını</strong> ister ve ekranda bu anahtarın parmak izini gösterir.
        Parmak izi, açık anahtarın <code>MD5</code> özetidir — telefonun ekranındaki değer ile
        buradaki değer eşleşiyorsa bağlantı güvenlidir.
      </p>

      <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
        <li>Telefonda <strong>Geliştirici seçenekleri → USB hata ayıklama</strong> açık olmalı.</li>
        <li>İlk bağlantıda telefon “USB hata ayıklamaya izin verilsin mi?” diye sorar.</li>
        <li>Ekrandaki parmak izini aşağıdaki <strong>MD5</strong> değeriyle karşılaştırın.</li>
        <li>Eşleşiyorsa <strong>“Bu bilgisayara her zaman izin ver”</strong> seçeneğini işaretleyin.</li>
      </ol>

      {mesgul && <div className="text-sm text-gray-400">Anahtar hazırlanıyor...</div>}
      {hata && <div className="text-sm text-red-500">{hata}</div>}

      {info && (
        <div className="space-y-2 rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-800/50">
          <div>
            <span className="text-gray-500 dark:text-gray-400">MD5 parmak izi: </span>
            <code className="break-all">{info.fingerprintMd5 ?? '—'}</code>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">SHA256 parmak izi: </span>
            <code className="break-all">{info.fingerprintSha256 ?? '—'}</code>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            Anahtar: {info.exists ? info.privatePath : 'oluşturulmadı'}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => void yenile()} disabled={mesgul} className="btn-ghost">
          Anahtarı yenile (rotate)
        </button>
        <button onClick={() => void sil()} disabled={mesgul} className="btn-ghost text-red-600">
          Anahtarı sil
        </button>
      </div>
    </section>
  )
}
