// Jest yapılandırması (prompt 161).
// - ts-jest: TypeScript kaynaklarını CommonJS'e çevirir (electron-vite'in ESNext
//   modülü Jest'in CJS çalışma zamanıyla çakışır; ayrı tsconfig.test.json kullanılır).
// - Varsayılan ortam jsdom (renderer bileşen testleri); main/services testleri
//   dosya başına `/** @jest-environment node */` ile node ortamına geçer.
// - @shared/@renderer alias'ları hem tsconfig hem burada eşlenir.
/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@renderer/(.*)$': '<rootDir>/src/renderer/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }]
  },
  collectCoverageFrom: [
    'src/main/services/**/*.ts',
    'src/main/services/**/*.tsx',
    'src/renderer/src/utils/**/*.ts',
    'src/renderer/src/components/**/*.tsx',
    '!src/main/services/**/index.ts',
    '!**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  clearMocks: true
}

module.exports = config
