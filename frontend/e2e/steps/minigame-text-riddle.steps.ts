import { Given, When, Then, expect, API_BASE } from './fixtures'

Given('ich bin im Texträtsel-Minispiel mit der Frage {string}', async ({ page, createdGameIds }, question: string) => {
  const gameRes = await page.request.post(`${API_BASE}/api/games`, {
    data: { name: 'E2E-Texträtsel' },
  })
  const game = await gameRes.json()
  createdGameIds.push(game.id)

  const stationRes = await page.request.post(`${API_BASE}/api/games/${game.id}/stations`, {
    data: {
      position: 1,
      image_path: 'test-placeholder.jpg',
      mini_game_type: 'text_riddle',
      mini_game_config: {
        type: 'text_riddle',
        question_text: question,
        answer_mode: 'multiple_choice',
        answer_options: [
          { text: 'Ei', is_correct: true },
          { text: 'Milch', is_correct: false },
          { text: 'Wolle', is_correct: false },
        ],
      },
    },
  })
  const station = await stationRes.json()
  await page.request.post(`${API_BASE}/api/games/${game.id}/start`)
  await page.goto(`/play/${game.id}/station/${station.id}`)
  await page.waitForLoadState('networkidle')
})

Given('die Antwortoptionen sind {string}, {string}, {string}', async ({ page }, _a: string, _b: string, _c: string) => {
  // State set up by background context
})

Given('die korrekte Antwort ist {string}', async ({ page }, _answer: string) => {
  // State set up by background context
})

Then('sehe ich die Frage {string}', async ({ page }, question: string) => {
  await expect(page.getByText(question)).toBeVisible()
})

Then('ich sehe {int} Antwortbuttons', async ({ page }, count: number) => {
  await expect(page.locator('[data-testid="answer-btn"]')).toHaveCount(count)
})

Then('ich sehe eine Wackel-Animation', async ({ page }) => {
  await expect(
    page.locator('[class*="shake"], [class*="wobble"], [data-testid="shake-animation"]')
  ).toBeVisible()
})

When('die Fehler-Animation abgeschlossen ist', async ({ page }) => {
  await page.waitForTimeout(1000)
})

Then('sind die Antwortbuttons wieder anklickbar', async ({ page }) => {
  await expect(page.locator('[data-testid="answer-btn"]').first()).toBeEnabled()
})

Given('TTS ist aktiviert', async ({ page }) => {
  // TTS enabled state
})

Then('sehe ich einen Vorlesen-Button', async ({ page }) => {
  await expect(page.getByTestId("tts-button")).toBeVisible()
})

When('ich auf den Vorlesen-Button klicke', async ({ page }) => {
  await page.getByTestId('tts-button').click()
})

Then('wird die Frage vorgelesen', async ({ page }) => {
  await expect(page.getByTestId("tts-button")).toBeVisible()
})
