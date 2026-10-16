import { useCallback, useEffect, useState } from 'react'
import type { DragEvent } from 'react'
import { useDeviceStore } from '../store/useDeviceStore'
import { useToastStore } from '../store/useToastStore'
import EmptyState from '../components/ui/EmptyState'
import SearchBar from '../components/ui/SearchBar'
import { formatBytes } from '../utils/format'
import type { FileEntry, FileKind } from '@shared/types'

const svg = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
} as const

function Ikon({ kind }: { kind: FileKind }) {
  switch (kind) {
    case 'folder':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" {...svg} className="text-amber-500">
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
      )
    case 'image':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" {...svg} className="text-emerald-500">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-4.35-4.35a1 1 0 0 0-1.4 0L6 20" />
        </svg>
      )
    case 'video':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" {...svg} className="text-violet-500">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m10 9 5 3-5 3z" />
        </svg>
      )
    case 'audio':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" {...svg} className="text-pink-500">
          <path d="M9 18V6l12-2v12" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      )
    case 'document':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" {...svg} className="text-blue-500">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      )
    case 'archive':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" {...svg} className="text-orange-500">
          <rect x="3" y="3" width="18" height="4" rx="1" />
          <path d="M5 7v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7" />
          <path d="M10 12h4" />
        </svg>
      )
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" {...svg} className="text-gray-400">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      )
  }
}

function kindOf(name: string): FileKind {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic'].includes(ext)) return 'image'
  if (['mp4', 'mkv', 'avi', 'mov', 'webm', '3gp', 'flv'].includes(ext)) return 'video'
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus'].includes(ext)) return 'audio'
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'json', 'html', 'xml'].includes(ext))
    return 'document'
  if (['zip', 'rar', '7z', 'tar', 'gz', 'apk', 'ab'].includes(ext)) return 'archive'
  return 'other'
}

// Dosya tarayıcı (prompt 129-140).
export default function FilesView() {
  const seciliCihaz = useDeviceStore((s) => s.seciliCihaz)
  const push = useToastStore((s) => s.push)
  const [yol, setYol] = useState('/sdcard/')
  const [dosyalar, setDosyalar] = useState<FileEntry[]>([])
  const [yukleniyor, setYukleniyor] = useState(false)
  const [arama, setArama] = useState('')
  const [secili, setSecili] = useState<Set<string>>(new Set())
  const [menu, setMenu] = useState<{ x: number; y: number; entry: FileEntry } | null>(null)
  const [onizleme, setOnizleme] = useState<{ entry: FileEntry; dataUrl: string } | null>(null)
  const [surukleniyor, setSurukleniyor] = useState(false)

  const listele = useCallback(
    async (p: string) => {
      if (!seciliCihaz) return
      setYukleniyor(true)
      try {
        setDosyalar(await window.api.listFiles(seciliCihaz.id, p))
        setYol(p)
        setSecili(new Set())
      } catch (e) {
        push(e instanceof Error ? e.message : 'Dosyalar listelenemedi', 'error')
      } finally {
        setYukleniyor(false)
      }
    },
    [seciliCihaz, push]
  )

  useEffect(() => {
    void listele('/sdcard/')
  }, [listele])

  const ust = () => {
    if (yol === '/sdcard/' || yol === '/sdcard') return
    const parcalar = yol.replace(/\/+$/, '').split('/')
    parcalar.pop()
    void listele(parcalar.join('/') + '/' || '/sdcard/')
  }

  const filtrelenmis = dosyalar.filter((d) => d.name.toLowerCase().includes(arama.toLowerCase()))

  const indir = async (e: FileEntry) => {
    if (!seciliCihaz) return
    try {
      push(`İndirildi: ${await window.api.pullFile(seciliCihaz.id, e.path)}`, 'success')
    } catch (err) {
      push(err instanceof Error ? err.message : 'İndirme başarısız', 'error')
    }
  }

  const sil = async (e: FileEntry) => {
    if (!seciliCihaz) return
    try {
      await window.api.deleteFile(seciliCihaz.id, e.path)
      push(`${e.name} silindi`, 'info')
      void listele(yol)
    } catch (err) {
      push(err instanceof Error ? err.message : 'Silme başarısız', 'error')
    }
  }

  const onizle = async (e: FileEntry) => {
    if (!seciliCihaz) return
    try {
      const dataUrl = await window.api.getThumbnail(seciliCihaz.id, e.path)
      if (dataUrl) setOnizleme({ entry: e, dataUrl })
    } catch {
      /* yoksay */
    }
  }

  const yeniKlasor = async () => {
    if (!seciliCihaz) return
    const ad = window.prompt('Klasör adı:')
    if (!ad) return
    try {
      await window.api.createFolder(seciliCihaz.id, yol, ad)
      void listele(yol)
    } catch (err) {
      push(err instanceof Error ? err.message : 'Klasör oluşturulamadı', 'error')
    }
  }

  const onDrop = async (ev: DragEvent) => {
    ev.preventDefault()
    setSurukleniyor(false)
    if (!seciliCihaz) return
    const files = Array.from(ev.dataTransfer.files)
    for (const f of files) {
      try {
        const p = window.api.getPathForFile(f)
        if (p) {
          await window.api.pushFile(seciliCihaz.id, p, yol)
          push(`${f.name} yüklendi`, 'success')
        }
      } catch (err) {
        push(err instanceof Error ? err.message : 'Yükleme başarısız', 'error')
      }
    }
    void listele(yol)
  }

  const secimToggle = (path: string) => {
    setSecili((prev) => {
      const n = new Set(prev)
      if (n.has(path)) n.delete(path)
      else n.add(path)
      return n
    })
  }

  const topluSil = async () => {
    if (!seciliCihaz) return
    for (const p of secili) {
      try {
        await window.api.deleteFile(seciliCihaz.id, p)
      } catch {
        /* yoksay */
      }
    }
    push(`${secili.size} öğe silindi`, 'info')
    setSecili(new Set())
    void listele(yol)
  }

  const topluIndir = async () => {
    if (!seciliCihaz) return
    for (const p of secili) {
      try {
        await window.api.pullFile(seciliCihaz.id, p)
      } catch {
        /* yoksay */
      }
    }
    push(`${secili.size} öğe indirildi`, 'success')
  }

  if (!seciliCihaz) {
    return (
      <EmptyState
        title="Cihaz seçilmedi"
        description="Dosya tarayıcı için cihazlar sayfasından bir cihaz seçin."
      />
    )
  }

  return (
    <div className="space-y-3">
      {/* araç çubuğu */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={ust} className="btn-ghost" title="Üst klasör">
          ↑ Üst
        </button>
        <button onClick={() => void listele(yol)} className="btn-ghost" title="Yenile">
          ↻
        </button>
        <button onClick={() => void yeniKlasor()} className="btn-ghost">
          Yeni klasör
        </button>
        <div className="min-w-[180px] flex-1">
          <SearchBar value={arama} onChange={setArama} placeholder="Dosya ara..." />
        </div>
        <span className="truncate text-xs text-gray-500 dark:text-gray-400">{yol}</span>
      </div>

      {/* toplu işlem (138) */}
      {secili.size > 0 && (
        <div className="flex items-center gap-2 rounded-md bg-brand-500/10 px-3 py-2 text-sm">
          <span>{secili.size} seçili</span>
          <button onClick={() => void topluIndir()} className="btn-ghost text-xs">
            İndir
          </button>
          <button onClick={() => void topluSil()} className="btn-ghost text-xs text-red-600">
            Sil
          </button>
          <button onClick={() => setSecili(new Set())} className="text-xs underline">
            Temizle
          </button>
        </div>
      )}

      {/* sürükle-bırak alanı (137) */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setSurukleniyor(true)
        }}
        onDragLeave={() => setSurukleniyor(false)}
        onDrop={(e) => void onDrop(e)}
        className={`card overflow-hidden ${
          surukleniyor ? 'border-2 border-dashed border-brand-500' : ''
        }`}
      >
        {yukleniyor ? (
          <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Yükleniyor...
          </div>
        ) : filtrelenmis.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Klasör boş. Dosya sürükleyip bırakarak yükleyebilirsiniz.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <th className="w-8 px-2 py-2">
                  <input
                    type="checkbox"
                    checked={filtrelenmis.length > 0 && filtrelenmis.every((d) => secili.has(d.path))}
                    onChange={(e) =>
                      setSecili(
                        e.target.checked ? new Set(filtrelenmis.map((d) => d.path)) : new Set()
                      )
                    }
                  />
                </th>
                <th className="px-2 py-2">Ad</th>
                <th className="px-2 py-2">Boyut</th>
                <th className="px-2 py-2">Tür</th>
              </tr>
            </thead>
            <tbody>
              {filtrelenmis.map((d) => {
                const kind: FileKind = d.isDir ? 'folder' : kindOf(d.name)
                return (
                  <tr
                    key={d.path}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      setMenu({ x: e.clientX, y: e.clientY, entry: d })
                    }}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={secili.has(d.path)}
                        onChange={() => secimToggle(d.path)}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        className="flex items-center gap-2"
                        onClick={() =>
                          d.isDir ? listele(d.path) : kind === 'image' ? onizle(d) : indir(d)
                        }
                      >
                        <Ikon kind={kind} />
                        <span className="truncate">{d.name}</span>
                      </button>
                    </td>
                    <td className="px-2 py-2 text-gray-500 dark:text-gray-400">
                      {d.isDir ? '—' : formatBytes(d.sizeBytes)}
                    </td>
                    <td className="px-2 py-2 text-gray-500 dark:text-gray-400">
                      {d.isDir ? 'Klasör' : kind}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* önizleme (139) */}
      {onizleme && (
        <div className="card p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">{onizleme.entry.name}</span>
            <button onClick={() => setOnizleme(null)} className="text-xs underline">
              Kapat
            </button>
          </div>
          <img src={onizleme.dataUrl} alt={onizleme.entry.name} className="max-h-64 rounded" />
        </div>
      )}

      {/* sağ tık menüsü (140) */}
      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
          <div
            className="fixed z-50 w-40 rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg dark:border-gray-700 dark:bg-surface"
            style={{ left: menu.x, top: menu.y }}
          >
            {menu.entry.isDir ? (
              <button
                className="block w-full px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => {
                  void listele(menu.entry.path)
                  setMenu(null)
                }}
              >
                Aç
              </button>
            ) : (
              <button
                className="block w-full px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => {
                  void indir(menu.entry)
                  setMenu(null)
                }}
              >
                İndir
              </button>
            )}
            <button
              className="block w-full px-3 py-1.5 text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => {
                void sil(menu.entry)
                setMenu(null)
              }}
            >
              Sil
            </button>
          </div>
        </>
      )}
    </div>
  )
}
