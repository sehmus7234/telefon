import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

// electron-vite: main + preload + renderer üç ayrı paket olarak derlenir.
export default defineConfig({
  main: {
    // dependencies'deki paketler (electron-log, electron-updater) dışsallaştırılır;
    // çalışma anında node_modules'tan require edilir.
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    },
    build: {
      rollupOptions: {
        // node-usb isteğe bağlıdır; kurulu değilse bile derlemeyi kırmasın (prompt 36).
        external: ['usb']
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        // Ana pencere + splash screen iki ayrı HTML girişi olarak derlenir.
        input: {
          index: resolve('src/renderer/index.html'),
          splash: resolve('src/renderer/splash.html')
        }
      }
    }
  }
})
