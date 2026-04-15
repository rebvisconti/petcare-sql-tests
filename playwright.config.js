// playwright.config.js

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir:   './tests',
  timeout:   30000,
  retries:   1,
  reporter:  [['html', { open: 'never' }], ['list']],

  use: {
    baseURL:       'http://localhost:3002',
    extraHTTPHeaders: { 'Content-Type': 'application/json' },
  },

  projects: [
    {
      name: 'API Tests',
      testDir: './tests/api',
    },
    {
      name: 'SQL Tests',
      testDir: './tests/sql',
    },
    {
      name: 'E2E Tests',
      testDir: './tests/e2e',
    },
  ],

  
});


