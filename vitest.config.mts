import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { config as loadEnv } from 'dotenv'

// Integration tests must hit the test DB (port 5433), never the dev DB.
// override: true so a stale .env already in the shell can't win.
const { parsed: testEnv = {} } = loadEnv({ path: '.env.test', override: true })

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.ts'],
    env: testEnv,
    // Integration tests share ONE Postgres test DB. Running files in parallel
    // races Payload's schema push ("type ... already exists") on a fresh volume.
    fileParallelism: false,
  },
})
