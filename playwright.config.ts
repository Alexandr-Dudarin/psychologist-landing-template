/// <reference types="node" />

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"]],
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: process.env.CI ? "on-first-retry" : "off",
    screenshot: "only-on-failure",
    video: "off",
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 3001",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      testIgnore: /.*webkit\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit-responsive",
      testMatch: /.*webkit\/.*\.spec\.ts/,
      use: {
        browserName: "webkit",
      },
    },
  ],
});