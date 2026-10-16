import { useState } from 'react'
import { useSessionStore } from '../store/useSessionStore'

// Uygulama kilit ekranı (prompt 146). Oturum kilitliyken tüm UI'nin üstünü kaplar.
export default function AppLock() {
  const kilitAc = useSessionStore((s) => s.kilitAc)
  const [parola, setParola] = useState('')
  const [hata, setHata] = useState<string | null>(null)

  const dene = async () => {
    setHata(null)
    const ok = await kilitAc(parola)
    if (!ok) {
      setHata('Parola hatalı.')
      setParola('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
      <div className="card w-full max-w-sm space-y-4 p-6">
        <div className="text-center">
          <div className="text-2xl">🔒</div>
          <h1 className="mt-2 text-lg font-semibold">Uygulama kilitli</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Devam etmek için ana parolanızı girin.
          </p>
        </div>
        <input
          type="password"
          value={parola}
          onChange={(e) => setParola(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void dene()}
          placeholder="Ana parola"
          autoFocus
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-800"
        />
        {hata && <div className="text-sm text-red-500">{hata}</div>}
        <button onClick={() => void dene()} className="btn-primary w-full">
          Kilidi aç
        </button>
      </div>
    </div>
  )
}
