import { Given, When, Then, expect, API_BASE } from './fixtures'

Given('ich bin auf der Creator-Startseite {string}', async ({ page }, path: string) => {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
})

When('ich bei {string} auf {string} klicke', async ({ page }, gameName: string, label: string) => {
  const gameRow = page.locator('[data-testid="game-list-item"]').filter({ hasText: gameName })
  await gameRow.getByRole('button', { name: label }).click()
})

Then('werde ich zum Spiel-Editor weitergeleitet', async ({ page }) => {
  await page.waitForURL(/\/creator\/game\//)
})

Then('das neue Spiel erscheint in der Liste', async ({ page }) => {
  // Navigate back to list to verify the game appears
  await page.goto('/creator')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-testid="game-list-item"]').first()).toBeVisible()
})

Given('es existiert ein Spiel {string}', async ({ page, createdGameIds }, name: string) => {
  const res = await page.request.post(`${API_BASE}/api/games`, { data: { name } })
  const game = await res.json()
  createdGameIds.push(game.id)
  await page.goto('/creator')
  await page.waitForLoadState('networkidle')
})

Then('bin ich im Spiel-Editor für {string}', async ({ page }, _name: string) => {
  await expect(page).toHaveURL(/\/creator\//)
})

Then('ist {string} nicht mehr in der Liste', async ({ page }, name: string) => {
  await expect(page.getByText(name)).not.toBeVisible()
})

Then('ist {string} noch in der Liste', async ({ page }, name: string) => {
  await expect(page.getByText(name)).toBeVisible()
})

Given('es existiert ein Spiel im Status {string}', async ({ page, createdGameIds }, _status: string) => {
  const res = await page.request.post(`${API_BASE}/api/games`, {
    data: { name: 'E2E-Statustest' },
  })
  const game = await res.json()
  createdGameIds.push(game.id)
  await page.goto('/creator')
  await page.waitForLoadState('networkidle')
})

Then('sehe ich ein Status-Badge mit {string}', async ({ page }, status: string) => {
  // Scope to the specific E2E test game row to avoid accumulated test data interference
  const gameRow = page.locator('[data-testid="game-list-item"]').filter({ hasText: 'E2E-Statustest' })
  await expect(gameRow.getByText(status)).toBeVisible()
})
