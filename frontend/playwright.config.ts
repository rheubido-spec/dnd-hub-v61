import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    browserName: 'chromium',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH ?? '/usr/bin/chromium', args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'] },
  },
  webServer: [
    {
      command: 'node ./node_modules/vite/dist/node/cli.js --host 127.0.0.1 --port 5173',
      port: 5173,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
})
