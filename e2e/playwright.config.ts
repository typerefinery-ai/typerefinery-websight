import { defineConfig, devices } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

/**
 * Playwright harness for the OS-Triage Mini App runsheet.
 *
 * The runsheet (`alpha-launch/docs/mini-app-runsheet.md`) is the script; every test
 * here is named after one of its stable step IDs (P0-S3, P1-S4, …) so a failure
 * points straight at a runsheet row and at the issue that tracks it.
 *
 * Artifacts (video, trace, screenshots, results.json) land in
 * `alpha-launch/docs/runs/<UTC timestamp>/` so a run can be reviewed after the fact.
 */

const WORKSPACE = path.resolve(__dirname, '..', '..')

// One directory per run. RUN_STAMP lets a caller (or a re-run) target an existing one.
const RUN_STAMP = process.env.RUN_STAMP || new Date().toISOString().replace(/[:.]/g, '-').replace('Z', 'Z')
export const RUN_DIR = path.join(WORKSPACE, 'docs', 'runs', RUN_STAMP)
fs.mkdirSync(RUN_DIR, { recursive: true })

// Traefik hostnames are the documented entry point; :8113 is the direct-port equivalent
// and is the fallback when Traefik 503s (docs/issues/0014).
export const CMS_BASE = process.env.CMS_BASE || 'https://cms.typerefinery.localhost:8101'
export const FLOW_BASE = process.env.FLOW_BASE || 'http://localhost:8111'
export const SHOWCASE = '/content/typerefinery-showcase/pages/os-triage'

export default defineConfig({
  testDir: './specs',
  outputDir: path.join(RUN_DIR, 'test-output'),
  // The stack is slow to warm; a cold CMS page can take a while on first hit.
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['json', { outputFile: path.join(RUN_DIR, 'results.json') }],
    ['html', { outputFolder: path.join(RUN_DIR, 'html-report'), open: 'never' }],
  ],
  use: {
    baseURL: CMS_BASE,
    // Traefik serves a self-signed cert (and Avast intercepts TLS on this machine).
    ignoreHTTPSErrors: true,
    // Both always on — the whole point of the run is that it can be reviewed later.
    video: { mode: 'on', size: { width: 1600, height: 1000 } },
    trace: 'on',
    screenshot: 'on',
    viewport: { width: 1600, height: 1000 },
    actionTimeout: 30_000,
    navigationTimeout: 90_000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    {
      name: 'runsheet',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: path.join(__dirname, '.auth', 'cms.json'),
      },
    },
  ],
})
