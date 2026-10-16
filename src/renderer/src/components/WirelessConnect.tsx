import { useState } from 'react'
import { useDeviceStore } from '../store/useDeviceStore'
import { useAdbStore } from '../store/useAdbStore'

// Kablosuz (Wi-Fi) ADB bağlantısı (prompt 31).
export default function WirelessConnect() {
  const [ip, setIp] = useState('')
  const [port, setPort] = useState('5555')
  const [mesaj, setMesaj] = useState<string | null>(null)
  const seciliCihaz = useDeviceStore((s) => s.seciliCihaz)
  const hataAta = useAdbStore((s) => s.hataAta)

  const portNum = Number(port) || 5555

  const baglan = async () => {
    setMesaj(null)
    try {
      setMesaj((await window.api.connectWireless(ip.trim(), portNum)).trim())
    } catch (e) {
      setMesaj(e instanceof Error ? e.message : String(e))
    }
  }

  const kopar = async () => {
    setMesaj(null)
    try {
      setMesaj((await window.api.disconnectWireless(ip.trim(), portNum)).trim())
    } catch (e) {
      setMesaj(e instanceof Error ? e.message : String(e))
    }
  }

  const tcpipAc = async () => {
    if (!seciliCihaz) return
    setMesaj(null)
    try {
      setMesaj((await window.api.enableWireless(seciliCihaz.id, portNum)).trim())
    } catch (e) {
      hataAta(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <section className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
      <h2 className="mb-2 font-semibold">Kablosuz Bağlantı (Wi-Fi)</h2>
      <div className="flex flex-wrap gap-2">
        <input
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="192.168.1.20"
          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
        />
        <input
          value={port}
          onChange={(e) => setPort(e.target.value)}
          placeholder="5555"
          className="w-20 rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
        />
        <button
          onClick={() => void baglan()}
          disabled={!ip.trim()}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Bağlan
        </button>
        <button
          onClick={() => void kopar()}
          disabled={!ip.trim()}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          Kopar
        </button>
        <button
          onClick={() => void tcpipAc()}
          disabled={!seciliCihaz}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          Seçili cihazda TCP/IP aç
        </button>
      </div>
      {mesaj && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{mesaj}</p>}
    </section>
  )
}
