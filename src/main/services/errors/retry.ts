// Ağ hataları için yeniden deneme mekanizması (prompt 153).
// Üstel geri çekilme + jitter ile; ağ benzeri hatalarda otomatik tekrar dener.

export interface RetryOptions {
  retries?: number // deneme sayısı (ilk deneme hariç)
  baseDelayMs?: number
  maxDelayMs?: number
  shouldRetry?: (error: unknown) => boolean
  onRetry?: (attempt: number, error: unknown) => void
}

// Ağ benzeri hataları tespit eder (ECONNRESET, ETIMEDOUT, 429, 5xx, fetch failure).
export function isNetworkError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return (
    /ECONNRESET|ETIMEDOUT|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|network|fetch failed|socket hang up|aborted/i.test(
      msg
    ) || /(429|5\d\d)/.test(msg)
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// fn'i belirtilen politika ile tekrar dener; tüm denemeler başarısızsa son hatayı fırlatır.
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const retries = options.retries ?? 3
  const baseDelayMs = options.baseDelayMs ?? 500
  const maxDelayMs = options.maxDelayMs ?? 10_000
  const shouldRetry = options.shouldRetry ?? isNetworkError

  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e
      const canRetry = attempt < retries && shouldRetry(e)
      if (!canRetry) throw e
      const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt)
      const jitter = exp * (0.5 + Math.random() * 0.5) // %50-100 arası jitter
      options.onRetry?.(attempt + 1, e)
      await sleep(Math.round(jitter))
    }
  }
  throw lastError
}
