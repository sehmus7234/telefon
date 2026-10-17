// E2E duman testi (prompt 164): uygulama başlar, ana pencere açılır ve yanıt verir.
// Çalıştırmadan önce `npm run build` gerekir (out/main/index.js üretilir).
// Headless: `xvfb-run -a npm run test:e2e`. Root kapsayıcıda --no-sandbox şart.
//
// BİLİNEN ENGELLEYİCİ: better-sqlite3 v13, N-API 10 (Node 22+) ister; Electron 33
// (Node 20) yalnızca N-API 9 destekler. Bu yüzden uygulama Electron altında
// `initDb` -> better-sqlite3 yüklenirken SIGSEGV verir. Çözüm: Electron'u >=35'e
// yükseltmek veya better-sqlite3'ü <=11'e indirip `electron-rebuild` uygulamak.
// Bu uyumsuzluk giderilene kadar E2E yalnızca Electron'un başladığını doğrular.
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
