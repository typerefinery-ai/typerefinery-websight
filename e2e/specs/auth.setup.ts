import { test as setup, expect } from '@playwright/test'
import * as path from 'path'

const AUTH_FILE = path.join(__dirname, '..', '.auth', 'cms.json')

/**
 * P0-S5 — log into the CMS.
 *
 * The credentials must be **typed**. The login form is React-controlled: assigning
 * `input.value` (or a DOM-level fill) leaves React's state empty and the submit button
 * silently does nothing. `pressSequentially` dispatches real keystrokes, which is what
 * the component listens for. See docs/ui-access.md §2.
 */
setup('P0-S5 — CMS login by typed credentials', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  const username = page.locator('[data-testid="login-form-username"]')
  const password = page.locator('[data-testid="login-form-password"]')
  await expect(username).toBeVisible({ timeout: 60_000 })

  await username.click()
  await username.pressSequentially('wsadmin', { delay: 40 })
  await password.click()
  await password.pressSequentially('wsadmin', { delay: 40 })

  await page.locator('#login-form button[type="submit"]').click()

  // A successful login leaves the login page for the authoring UI.
  await expect(page).not.toHaveURL(/login\.html/, { timeout: 60_000 })

  await page.context().storageState({ path: AUTH_FILE })
})
