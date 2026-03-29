/**
 * E2E: Image Upload Modal — clicking "Bild hochladen" in station editor opens modal
 *
 * Requires a running backend at http://localhost:8000
 * If the server is not running, the test is skipped gracefully.
 */
import { test, expect, request } from '@playwright/test'

const API_BASE = 'http://localhost:8000'

test('Image upload: clicking "Bild hochladen" opens modal with Fotomediathek and Kamera options', async ({ page }) => {
  // Check server availability
  let api
  try {
    api = await request.newContext({ baseURL: API_BASE })
    const health = await api.get('/api/games')
    if (!health.ok()) {
      test.skip()
      return
    }
  } catch {
    test.skip()
    return
  }

  // Create a fresh draft game with one station via API
  const gameRes = await api.post('/api/games', { data: { name: 'Image Upload E2E Test' } })
  expect(gameRes.ok()).toBeTruthy()
  const game = await gameRes.json() as { id: string }

  const stationRes = await api.post(`/api/games/${game.id}/stations`, {
    data: { position: 1, mini_game_type: 'text_riddle', mini_game_config: {} },
  })
  expect(stationRes.ok()).toBeTruthy()
  const station = await stationRes.json() as { id: string }

  await api.dispose()

  // Navigate to the station editor
  await page.goto(`/creator/game/${game.id}/station/${station.id}`)

  // Wait for the page to load
  await expect(page.getByText('Stationsbild')).toBeVisible()

  // The modal should NOT be visible initially
  await expect(page.getByRole('dialog')).not.toBeVisible()

  // Click "Bild hochladen" button
  await page.getByText('Bild hochladen').click()

  // Modal should now be visible with title
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  // Both options must be present
  await expect(dialog.getByText('Fotomediathek')).toBeVisible()
  await expect(dialog.getByText('Kamera')).toBeVisible()
})
