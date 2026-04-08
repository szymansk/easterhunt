import { Given, When, Then, expect, API_BASE } from './fixtures'

Given('ich bin im Stations-Editor für Station {int}', async ({ page, createdGameIds }, _index: number) => {
  const gameRes = await page.request.post(`${API_BASE}/api/games`, {
    data: { name: 'E2E-Stationseditor' },
  })
  const game = await gameRes.json()
  createdGameIds.push(game.id)

  const stationRes = await page.request.post(`${API_BASE}/api/games/${game.id}/stations`, {
    data: {
      position: 1,
      image_path: null,
      mini_game_type: 'puzzle',
      mini_game_config: { type: 'puzzle', grid_size: 4 },
    },
  })
  const station = await stationRes.json()
  await page.goto(`/creator/game/${game.id}/station/${station.id}`)
  await page.waitForLoadState('networkidle')
})

Then("ist {string} als aktiver Typ markiert", async ({ page }, type: string) => {
  const btn = page.getByRole('button', { name: type })
  await expect(btn).toBeVisible()
  // Check for active state via class or aria
  const isActive = await btn.evaluate((el) =>
    el.classList.contains('active') ||
    el.classList.contains('selected') ||
    el.getAttribute('aria-pressed') === 'true' ||
    el.getAttribute('data-active') === 'true'
  )
  expect(isActive).toBeTruthy()
})

Then('die Puzzle-Konfiguration ist sichtbar', async ({ page }) => {
  await expect(page.getByTestId('puzzle-config')).toBeVisible()
})

Given('{string} ist ausgewählt', async ({ page }, type: string) => {
  await page.locator('[data-testid="mini-game-type-selector"]').getByRole('button', { name: type }).click()
})

Then("ist {string} immer noch ausgewählt", async ({ page }, type: string) => {
  const btn = page.getByRole('button', { name: type })
  await expect(btn).toBeVisible()
})

Given('das Bild-Upload-Modal ist geöffnet', async ({ page }) => {
  await page.getByRole('button', { name: /Bild hochladen/i }).click()
})

Given("ich habe {string} ausgewählt", async ({ page }, type: string) => {
  await page.locator('[data-testid="mini-game-type-selector"]').getByRole('button', { name: type }).click()
})

Given('ich habe eine Frage eingegeben', async ({ page }) => {
  await page.getByPlaceholder(/Frage/i).fill('Was legt die Henne?')
})

Given('ich habe mindestens 2 Antwortoptionen eingegeben', async ({ page }) => {
  const inputs = page.getByPlaceholder(/Antwort/i)
  await inputs.first().fill('Ei')
  await inputs.nth(1).fill('Milch')
})

Then('sehe ich eine Erfolgsbestätigung', async ({ page }) => {
  await expect(page.getByText(/gespeichert|Erfolg|erfolgreich/i)).toBeVisible()
})
