import { defineConfig, devices } from '@playwright/test'

const CI_RETRY_COUNT = 2
const APP_HOST = '127.0.0.1'
const APP_PORT = 4173
const APP_URL = `http://${APP_HOST}:${APP_PORT}`
const DESKTOP_VIEWPORT = { width: 1440, height: 900 }

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? CI_RETRY_COUNT : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: APP_URL,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: DESKTOP_VIEWPORT,
      },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 7'],
      },
    },
  ],
  webServer: {
    command: `pnpm dev --host ${APP_HOST} --port ${APP_PORT}`,
    url: APP_URL,
    reuseExistingServer: !process.env.CI,
  },
})
