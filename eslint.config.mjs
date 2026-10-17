// ESLint 9 düz (flat) yapılandırma (prompt 167).
// typescript-eslint (önerilen) + react + react-hooks + prettier uyumluluğu.
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'out/**',
      'release/**',
      'dist/**',
      'coverage/**',
      'scripts/.security.selfcheck.cjs'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  reactHooks.configs['recommended-latest'],
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    settings: {
      react: { version: 'detect' }
    },
    rules: {
      // React 17+ yeni JSX dönüşümü: `import React` gerekmez.
      'react/react-in-jsx-scope': 'off',
      // Tipler TypeScript ile doğrulanır; prop-types gereksiz.
      'react/prop-types': 'off',
      // Türkçe metinlerde kesme işareti (&apos; değil) doğal karşılanır.
      'react/no-unescaped-entities': 'off',
      // Mevcut 160 özelliklik kodda yaygın; hata yerine uyarı yeterli.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ]
    }
  },
  // .js/.mjs/.cjs yapılandırma/komut dosyaları CommonJS kullanır (require geçerli).
  {
    files: ['**/*.{js,mjs,cjs}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off'
    }
  },
  eslintConfigPrettier
)
