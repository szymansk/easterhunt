import { Given, When, Then, expect, API_BASE } from './fixtures'

Given('ich bin im Zahlenrätsel-Minispiel', async ({ page, createdGameIds }) => {
  const gameRes = await page.request.post(`${API_BASE}/api/games`, {
    data: { name: 'E2E-Zahlenrätsel' },
  })
  const game = await gameRes.json()
  createdGameIds.push(game.id)

  const stationRes = await page.request.post(`${API_BASE}/api/games/${game.id}/stations`, {
    data: {
      position: 1,
      image_path: 'test-placeholder.jpg',
      mini_game_type: 'number_riddle',
      mini_game_config: {
        type: 'number_riddle',
        task_type: 'plus_minus',
        prompt_text: '3 + 2',
        correct_answer: 5,
        distractor_answers: [3, 7],
      },
    },
  })
  const station = await stationRes.json()
  await page.request.post(`${API_BASE}/api/games/${game.id}/start`)
  await page.goto(`/play/${game.id}/station/${station.id}`)
  await page.waitForLoadState('networkidle')
})

Given('die Aufgabe lautet {string}', async ({ page }, _task: string) => {
  // State set by background
})

Given('die Distraktoren sind {string}, {string}', async ({ page }, _a: string, _b: string) => {
  // State set by background
})

Then('sehe ich die Aufgabe {string}', async ({ page }, task: string) => {
  await expect(page.getByText(task)).toBeVisible()
})

Then('ich sehe Zahlenbuttons', async ({ page }) => {
  await expect(page.locator('[data-testid="number-btn"]').first()).toBeVisible()
})

Then('die Antwortbuttons werden nach kurzer Zeit wieder aktiv', async ({ page }) => {
  await page.waitForTimeout(1000)
  await expect(page.locator('[data-testid="number-btn"]').first()).toBeEnabled()
})

Then('haben alle Zahlenbuttons eine Mindestgröße von {int}px', async ({ page }, size: number) => {
  const buttons = page.locator('[data-testid="number-btn"]')
  const count = await buttons.count()
  for (let i = 0; i < count; i++) {
    const box = await buttons.nth(i).boundingBox()
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(size)
      expect(box.height).toBeGreaterThanOrEqual(size)
    }
  }
})
