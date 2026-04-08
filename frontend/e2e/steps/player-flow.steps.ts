import { Given, When, Then, expect, API_BASE } from './fixtures'

async function createStartedGame(page: import('@playwright/test').Page, stationCount: number, createdGameIds: string[]): Promise<string> {
  const gameRes = await page.request.post(`${API_BASE}/api/games`, {
    data: { name: 'E2E-Spielertest' },
  })
  const game = await gameRes.json()
  createdGameIds.push(game.id)

  for (let i = 1; i <= stationCount; i++) {
    await page.request.post(`${API_BASE}/api/games/${game.id}/stations`, {
      data: {
        position: i,
        image_path: 'test-placeholder.jpg',
        mini_game_type: 'text_riddle',
        mini_game_config: {
          type: 'text_riddle',
          question_text: `Frage ${i}`,
          answer_mode: 'multiple_choice',
          answer_options: [
            { text: 'Richtig', is_correct: true },
            { text: 'Falsch', is_correct: false },
          ],
        },
      },
    })
  }

  await page.request.post(`${API_BASE}/api/games/${game.id}/start`)
  return game.id
}

Given('es gibt ein gestartetes Spiel mit {int} Stationen', async ({ page, createdGameIds }, count: number) => {
  const gameId = await createStartedGame(page, count, createdGameIds)
  await page.goto(`/play/${gameId}`)
  await page.waitForLoadState('networkidle')
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

Given('ich habe Station {int} abgeschlossen', async ({ page, createdGameIds }, _index: number) => {
  const gameId = await createStartedGame(page, 3, createdGameIds)
  await page.goto(`/play/${gameId}`)
  await page.waitForLoadState('networkidle')
})

Then('ist Station {int} als abgeschlossen markiert', async ({ page }, index: number) => {
  await expect(
    page.locator('[data-testid="station-card"]').nth(index - 1).locator('[data-testid="completed-badge"]')
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

Given('ich habe alle {int} Stationen abgeschlossen', async ({ page, createdGameIds }, count: number) => {
  const gameId = await createStartedGame(page, count, createdGameIds)
  await page.goto(`/play/${gameId}`)
  await page.waitForLoadState('networkidle')
})

Then('sehe ich die Glückwunsch-Seite', async ({ page }) => {
  await expect(page).toHaveURL(/\/(play\/complete|congratulations|success)/)
})
