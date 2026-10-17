// Playwright E2E yapılandırması (prompt 164).
// Electron masaüstü uygulamasını `_electron` ile başlatır.
// Headless Linux'ta çalıştırmak için `xvfb-run -a` + `--no-sandbox` gerekir.
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    trace: 'on-first-retry'
  }
})
