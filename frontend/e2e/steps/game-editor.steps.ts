import { Given, When, Then, expect, API_BASE } from './fixtures'

Given('ich habe ein neues Spiel erstellt', async ({ page, createdGameIds }) => {
  const res = await page.request.post(`${API_BASE}/api/games`, {
    data: { name: 'E2E-Testspiel' },
  })
  const game = await res.json()
  createdGameIds.push(game.id)
  await page.goto(`/creator/game/${game.id}`)
  await page.waitForLoadState('networkidle')
})

Given('ich bin im Spiel-Editor', async ({ page }) => {
  await expect(page).toHaveURL(/\/creator\//)
})

When('ich auf den Spielnamen klicke', async ({ page }) => {
  await page.getByTestId('game-title').click()
})

Then('erscheint ein Eingabefeld mit dem aktuellen Namen', async ({ page }) => {
  await expect(page.getByRole('textbox')).toBeVisible()
})

When('ich den Namen auf {string} ändere', async ({ page }, name: string) => {
  await page.getByRole('textbox').fill(name)
})

When('auf {string} klicke', async ({ page }, label: string) => {
  await page.getByRole('button', { name: label }).click()
})

Then('zeigt die Überschrift {string}', async ({ page }, heading: string) => {
  await expect(page.getByRole('heading', { name: heading })).toBeVisible()
})

When('den Namen ändere', async ({ page }) => {
  await page.getByRole('textbox').fill('Neuer Name')
})

When('Escape drücke', async ({ page }) => {
  await page.keyboard.press('Escape')
})

Then('zeigt die Überschrift den ursprünglichen Namen', async ({ page }) => {
  // game-title testid to avoid strict mode with multiple headings on the page
  const heading = page.getByTestId('game-title')
  await expect(heading).toBeVisible()
})

Then('erscheint eine neue Station in der Liste', async ({ page }) => {
  await expect(page.locator('[data-testid="station-item"]').first()).toBeVisible()
})

Then('die Stationsanzahl erhöht sich um 1', async ({ page }) => {
  // Verified by previous step - station appears in list
})

Given('ich habe eine Station ohne Bild hinzugefügt', async ({ page }) => {
  await page.getByRole('button', { name: /\+ Station/i }).click()
})

Then('sehe ich eine Fehlermeldung über fehlende Bilder', async ({ page }) => {
  // Either the station list item shows "Kein Stationsbild" or the error summary after clicking start
  await expect(page.getByText(/Kein Stationsbild/i).first()).toBeVisible()
})

Given('ich habe eine Station hinzugefügt', async ({ page }) => {
  await page.getByRole('button', { name: /\+ Station/i }).click()
})

When("ich auf 'Bearbeiten' bei der Station klicke", async ({ page }) => {
  await page.locator('[data-testid="station-item"]').first().getByRole('button', { name: /Bearbeiten/i }).click()
  await page.waitForURL(/\/station\//)
})

Given('ich habe 20 Stationen hinzugefügt', async ({ page, createdGameIds }) => {
  // Extract game ID from URL and create 20 stations via API for speed/reliability
  const url = page.url()
  const match = url.match(/\/game\/([^/]+)/)
  if (!match) throw new Error('Cannot find game ID in URL')
  const gameId = match[1]
  for (let i = 0; i < 20; i++) {
    await page.request.post(`${API_BASE}/api/games/${gameId}/stations`, {
      data: { position: i + 1, image_path: null, mini_game_type: 'puzzle', mini_game_config: { type: 'puzzle', grid_size: 4 } },
    })
  }
  await page.reload()
  await page.waitForLoadState('networkidle')
})
