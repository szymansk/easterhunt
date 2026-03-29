import { Given, When, Then, expect } from './fixtures'

Given('alle Stationen sind abgeschlossen', async ({ page }) => {
  await page.goto('/play')
})

Given('ich bin auf der Glückwunsch-Seite', async ({ page }) => {
  await page.goto('/play/complete')
})

Then('bin ich auf der Player-Übersicht', async ({ page }) => {
  await expect(page).toHaveURL(/\/play$/)
})

Then('Station 1 ist wieder die aktuelle Station', async ({ page }) => {
  await expect(
    page.locator('[data-testid="station-card"]').first().locator('[data-testid="current-badge"]')
  ).toBeVisible()
})

Then('bin ich auf der Startseite {string}', async ({ page }, _path: string) => {
  await expect(page).toHaveURL(/\/$/)
})
