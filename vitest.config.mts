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
    // getPayload() on a cold connection is genuinely slow: against a fresh
    // volume the first file pays the whole schema push (~6.7s locally, more on
    // a shared CI runner), which blew vitest's 10s default and failed
    // booking-proof.int.spec.ts in beforeAll with every assertion in it fine.
    // CI now runs init:db first so the push happens outside the hook — this is
    // the backstop for a cold local run, where nobody does that.
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
})
