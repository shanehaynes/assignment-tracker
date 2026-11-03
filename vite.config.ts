import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { devPort } from './dev/port.ts'
import { progressPlugin } from './dev/progress-plugin.ts'

const port = devPort()
// GitHub Pages serves the app under /assignment-tracker/; the Pages workflow sets VITE_BASE.
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [react(), progressPlugin()],
  server: { port, strictPort: true },
  preview: { port, strictPort: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: [
      'src/**/*.test.{ts,tsx}',
      'dev/**/*.test.ts',
      'data/**/*.test.ts',
      'tests/**/*.test.{ts,tsx}',
    ],
  },
})
