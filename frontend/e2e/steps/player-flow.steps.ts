import { Given, When, Then, expect } from './fixtures'

Given('es gibt ein gestartetes Spiel mit {int} Stationen', async ({ page }, _count: number) => {
  await page.goto('/play')
})

When('ich das Spiel öffne', async ({ page }) => {
  await page.waitForLoadState('networkidle')
})

Then('sehe ich {int} Stationskarten', async ({ page }, count: number) => {
  await expect(page.locator('[data-testid="station-card"]')).toHaveCount(count)
})

Then('Station {int} ist als aktuell markiert', async ({ page }, index: number) => {
  await expect(
    page.locator('[data-testid="station-card"]').nth(index - 1).locator('[data-testid="current-badge"]')
  ).toBeVisible()
})

Then('Station {int} ist gesperrt', async ({ page }, index: number) => {
  await expect(
    page.locator('[data-testid="station-card"]').nth(index - 1)
  ).toHaveAttribute('data-locked', 'true')
})

When('ich auf Station {int} klicke', async ({ page }, index: number) => {
  await page.locator('[data-testid="station-card"]').nth(index - 1).click()
})

Then('bleibe ich auf der Player-Übersicht', async ({ page }) => {
  await expect(page).toHaveURL(/\/play$/)
})

Then('bin ich im Minispiel von Station {int}', async ({ page }, _index: number) => {
  await expect(page).toHaveURL(/\/play\//)
})

Given('ich habe Station {int} abgeschlossen', async ({ page }, _index: number) => {
  await page.goto('/play')
})

Then('ist Station {int} als abgeschlossen markiert', async ({ page }, index: number) => {
  await expect(
    page.locator('[data-testid="station-card"]').nth(index - 1).locator('[data-testid="completed-badge"]')
  ).toBeVisible()
})

Then('Station {int} ist jetzt die aktuelle Station', async ({ page }, index: number) => {
  await expect(
    page.locator('[data-testid="station-card"]').nth(index - 1).locator('[data-testid="current-badge"]')
  ).toBeVisible()
})

Then('Station {int} ist noch gesperrt', async ({ page }, index: number) => {
  await expect(
    page.locator('[data-testid="station-card"]').nth(index - 1)
  ).toHaveAttribute('data-locked', 'true')
})

When('ich auf den Musik-Button klicke', async ({ page }) => {
  await page.getByRole('button', { name: /Musik/i }).click()
})

Then('ändert sich das Musik-Icon', async ({ page }) => {
  await expect(page.getByRole('button', { name: /Musik/i })).toBeVisible()
})

Given('ich habe alle {int} Stationen abgeschlossen', async ({ page }, _count: number) => {
  await page.goto('/play')
})

Then('sehe ich die Glückwunsch-Seite', async ({ page }) => {
  await expect(page).toHaveURL(/\/(play\/complete|congratulations|success)/)
})
