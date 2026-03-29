import { Given, When, Then, expect, API_BASE } from './fixtures'

Given('alle Stationen sind abgeschlossen', async ({ page, createdGameIds }) => {
  const gameRes = await page.request.post(`${API_BASE}/api/games`, {
    data: { name: 'E2E-Abschlusstest' },
  })
  const game = await gameRes.json()
  createdGameIds.push(game.id)

  await page.request.post(`${API_BASE}/api/games/${game.id}/stations`, {
    data: {
      position: 1,
      image_path: 'test-placeholder.jpg',
      mini_game_type: 'text_riddle',
      mini_game_config: {
        type: 'text_riddle',
        question_text: 'Testfrage',
        answer_mode: 'multiple_choice',
        answer_options: [
          { text: 'Richtig', is_correct: true },
          { text: 'Falsch', is_correct: false },
        ],
      },
    },
  })
  await page.request.post(`${API_BASE}/api/games/${game.id}/start`)
  await page.goto(`/play/${game.id}/complete`)
  await page.waitForLoadState('networkidle')
})

Given('ich bin auf der Glückwunsch-Seite', async ({ page }) => {
  await page.waitForLoadState('networkidle')
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
