import { defineConfig, devices } from '@playwright/test';

process.env.NODE_NO_WARNINGS = '1';

const useSupabase = process.env.E2E_SUPABASE === 'true';
const useRealGemini = process.env.E2E_GEMINI_REAL === 'true';
const useEdge = process.env.E2E_EDGE === 'true';
const webServerCommand = useRealGemini ? 'npm run dev:full' : 'npm run dev';

const projects = [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'mobile-chrome',
    use: { ...devices['Pixel 5'] },
  },
];

if (useEdge) {
  projects.push({
    name: 'edge',
    use: { ...devices['Desktop Chrome'], channel: 'msedge' },
  });
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    launchOptions: {
      slowMo: Number(process.env.E2E_SLOWMO_MS || 0),
    },
  },

  projects,

  webServer: {
    command: webServerCommand,
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_GEMINI_MOCK: useRealGemini ? 'false' : 'true',
      VITE_STORAGE_PROVIDER: useSupabase ? 'supabase' : 'local',
      VITE_SUPABASE_AUTH_MODE: useSupabase ? 'anonymous' : 'none',
      VITE_API_BASE_URL: useRealGemini ? 'http://localhost:8787' : '',
      NODE_OPTIONS: '',
    },
  },
});
