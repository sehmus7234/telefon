import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
  stack?: string
}

// Global hata sınırı (prompt 151): render hatalarını yakalar, kullanıcı dostu
// bir geri dönüş ekranı gösterir ve hatayı main süreçteki hata loguna yazar.
export default class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message, stack: error.stack }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Hatayı kalıcı hata loguna yaz (154).
    void window.api.logError(
      'error',
      'renderer',
      error.message,
      `${error.stack}\n${info.componentStack}`
    )
  }

  private yenidenYukle = (): void => {
    window.location.reload()
  }

  private raporGonder = async (): Promise<void> => {
    try {
      const r = await window.api.exportErrorReport()
      if (r.filePath) {
        // Kullanıcıya rapor dosyasının kaydedildiği yer gösterilir.
        alert(`Hata raporu oluşturuldu:\n${r.filePath}`)
      }
    } catch {
      /* rapor alınamadı */
    }
  }

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-6 dark:bg-[#0f1117]">
        <div className="card max-w-lg space-y-4 p-6 text-center">
          <div className="text-3xl">⚠️</div>
          <h1 className="text-lg font-semibold">Beklenmeyen bir hata oluştu</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Uygulama bu hatayı yakaladı. Yeniden yüklemeyi deneyebilir veya bir hata raporu
            gönderebilirsiniz.
          </p>
          <pre className="max-h-40 overflow-auto rounded bg-gray-100 p-3 text-left text-xs text-red-600 dark:bg-gray-800 dark:text-red-300">
            {this.state.message}
          </pre>
          <div className="flex justify-center gap-2">
            <button onClick={this.yenidenYukle} className="btn-primary">
              Yeniden yükle
            </button>
            <button onClick={() => void this.raporGonder()} className="btn-ghost">
              Hata raporu gönder
            </button>
          </div>
        </div>
      </div>
    )
  }
}
