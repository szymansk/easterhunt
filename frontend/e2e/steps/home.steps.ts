import { Given } from './fixtures'

Given('ich bin auf der 404-Seite', async ({ page }) => {
  await page.goto('/unbekannte-seite')
  await page.waitForLoadState('networkidle')
})
