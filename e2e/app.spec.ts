// E2E duman testi (prompt 164): uygulama başlar, ana pencere açılır ve yanıt verir.
// Çalıştırmadan önce `npm run build` gerekir (out/main/index.js üretilir).
// Headless: `xvfb-run -a npm run test:e2e`. Root kapsayıcıda --no-sandbox şart.
//
// Native modül notu: better-sqlite3 v13 (N-API 10) Electron 33 (Node 20/N-API 9)
// ile SIGSEGV verdiği için v11'e indirildi ve Electron'a göre derlendi
// (`npm run rebuild:native` veya CI'daki electron-rebuild adımı). v11 ham V8 ABI
// kullanır; Node ön-derlemesi Electron'da çalışmaz, Electron'a göre derlenmelidir.
import { test, expect, _electron as electron } from '@playwright/test'
import type { ElectronApplication, Page } from '@playwright/test'
import electronModule from 'electron'

// electron paketi runtime'da ikili yolunu döndürür (TS tipleri API ad alanıdır).
const electronPath = electronModule as unknown as string

let app: ElectronApplication

test.beforeAll(async () => {
  app = await electron.launch({
    executablePath: electronPath,
    args: ['out/main/index.js', '--no-sandbox'],
    env: { ...process.env, ELECTRON_DISABLE_SANDBOX: '1' }
  })
})

test.afterAll(async () => {
  await app?.close()
})

// İlk pencere splash'tir; ana pencereyi başlığa göre bekler.
async function anaPencere(timeoutMs = 30_000): Promise<Page> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    for (const p of app.windows()) {
      const t = await p.title().catch(() => '')
      if (t === 'Telefon') return p
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error('Ana pencere açılmadı')
}

test('ana pencere "Telefon" başlığıyla açılır', async () => {
  const win = await anaPencere()
  expect(await win.title()).toBe('Telefon')
})

test('renderer yüklenir ve kök öğe oluşur', async () => {
  const win = await anaPencere()
  await win.waitForLoadState('domcontentloaded')
  const root = win.locator('#root')
  await expect(root).toHaveCount(1)
})
