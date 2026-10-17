// Jest global kurulumu (prompt 161).
// CommonJS olmalı: ESM `import` jsdom ortamında yükleme hatası verir.
// jest-dom v7+ ESM-only olduğu için try/require ile yüklenir; testler
// yerleşik matcher'larla (getByText, textContent, className) da çalışır.
try {
  require('@testing-library/jest-dom')
} catch {
  // jest-dom yüklenemezse sessizce geç — testler bu matcher'lara bağımlı değil.
}
