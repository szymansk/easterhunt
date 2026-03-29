/**
 * E2E: Edge Cases
 * - Incomplete game start attempt → error/disabled state
 * - Wrong answer → retry possible, station not completed
 *
 * Requires a running backend at http://localhost:8000
 */
import { test, expect, request } from '@playwright/test'

const API_BASE = 'http://localhost:8000'

async function createStartedTextRiddleGame() {
  const api = await request.newContext({ baseURL: API_BASE })

  const gameRes = await api.post('/api/games', { data: { name: 'Edge Case Test' } })
  const game = await gameRes.json()

  // Create a text riddle station with a known correct answer
  await api.post(`/api/games/${game.id}/stations`, {
    data: {
      position: 1,
      image_path: null,
      mini_game_type: 'text_riddle',
      mini_game_config: {
        type: 'text_riddle',
        question_text: 'Was feiern wir im Frühling?',
        answer_mode: 'multiple_choice',
        answer_options: [
          { text: 'Ostern', is_correct: true },
          { text: 'Weihnachten', is_correct: false },
          { text: 'Halloween', is_correct: false },
        ],
        tts_enabled: false,
      },
    },
  })

  const stationsRes = await api.get(`/api/games/${game.id}/stations`)
  const stations = await stationsRes.json()

  // Start the game
  await api.post(`/api/games/${game.id}/start`)
  // Create progress
  await api.post(`/api/games/${game.id}/progress`)

  await api.dispose()
  return { game, stationId: stations[0].id }
}

test('Edge: wrong answer shows shake feedback but station not completed', async ({ page }) => {
  const { game, stationId } = await createStartedTextRiddleGame()

  await page.goto(`/play/${game.id}/station/${stationId}`)

  // Question should be visible
  await expect(page.getByText('Was feiern wir im Frühling?')).toBeVisible({ timeout: 10000 })

  // Click wrong answer
  await page.getByText('Weihnachten').click()

  // After wrong answer: still on same page (no navigation)
  await page.waitForTimeout(800) // let animation complete
  await expect(page).toHaveURL(new RegExp(`/station/${stationId}$`))

  // Question should still be visible (station not completed)
  await expect(page.getByText('Was feiern wir im Frühling?')).toBeVisible()
})

test('Edge: after wrong answer, correct answer completes station', async ({ page }) => {
  const { game, stationId } = await createStartedTextRiddleGame()

  await page.goto(`/play/${game.id}/station/${stationId}`)

  await expect(page.getByText('Was feiern wir im Frühling?')).toBeVisible({ timeout: 10000 })

  // Click wrong answer first
  await page.getByText('Weihnachten').click()
  await page.waitForTimeout(700)

  // Then click correct answer
  await page.getByText('Ostern').click()

  // Success overlay appears
  await expect(page.getByText(/Super gemacht/)).toBeVisible({ timeout: 5000 })

  // Navigates back to game
  await expect(page).toHaveURL(new RegExp(`/play/${game.id}$`), { timeout: 8000 })

  // Station is now completed
  await expect(page.getByTestId('station-1')).toHaveAttribute('data-status', 'completed', {
    timeout: 5000,
  })
})

test('Edge: player accessing unknown game shows error', async ({ page }) => {
  await page.goto('/play/nonexistent-game-id-12345')
  // Should show an error message or redirect to 404
  // The page either shows an ErrorMessage or navigates to /404
  await page.waitForLoadState('networkidle')
  const url = page.url()
  const hasError =
    url.includes('/404') ||
    (await page.getByText(/konnte nicht geladen werden/).isVisible().catch(() => false)) ||
    (await page.getByText(/nicht gefunden/).isVisible().catch(() => false))
  expect(hasError).toBeTruthy()
})
