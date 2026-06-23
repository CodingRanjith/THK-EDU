import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function getCorruptDirPaths() {
  try {
    return fs
      .readdirSync(__dirname, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory()
          && (entry.name === 'node_modules.bak' || entry.name.startsWith('node_modules.bad-'))
      )
      .map((entry) => path.join(__dirname, entry.name))
  } catch {
    return []
  }
}

const corruptDirPaths = getCorruptDirPaths()

function ignoreCorruptNodeModules() {
  return {
    name: 'ignore-corrupt-node-modules',
    configureServer(server) {
      for (const dir of corruptDirPaths) {
        server.watcher.unwatch(dir)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), ignoreCorruptNodeModules()],
  optimizeDeps: {
    include: ['xlsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      xlsx: path.resolve(__dirname, 'node_modules/xlsx/xlsx.mjs'),
    },
  },
  server: {
    port: 5173,
    watch: {
      ignored: [
        ...corruptDirPaths,
        /node_modules\.bak/i,
        /node_modules\.bad-/i,
      ],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
