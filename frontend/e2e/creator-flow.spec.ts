/**
 * E2E: Creator Flow — create a game, add/configure a station, start it
 *
 * Requires a running backend at http://localhost:8000
 */
import { test, expect, request } from '@playwright/test'

const API_BASE = 'http://localhost:8000'

test('Creator: game editor shows station list and add button', async ({ page }) => {
  const api = await request.newContext({ baseURL: API_BASE })

  // Create a fresh draft game via API
  const gameRes = await api.post('/api/games', { data: { name: 'Creator E2E Test' } })
  expect(gameRes.ok()).toBeTruthy()
  const game = await gameRes.json()

  await api.dispose()

  // Navigate to the creator editor
  await page.goto(`/creator/game/${game.id}`)

  // The game name should be visible
  await expect(page.getByText('Creator E2E Test')).toBeVisible()

  // The "Stationen" heading and "+ Station" button should be visible
  await expect(page.getByText(/Stationen/)).toBeVisible()
  const addBtn = page.getByRole('button', { name: /Station/ })
  await expect(addBtn).toBeVisible()

  // The start button should be disabled (no stations yet) and show helper text
  await expect(page.getByText(/Mindestens eine Station/)).toBeVisible()
})

test('Creator: adding a station enables start button', async ({ page }) => {
  const api = await request.newContext({ baseURL: API_BASE })

  const gameRes = await api.post('/api/games', { data: { name: 'Creator E2E Station Test' } })
  const game = await gameRes.json()
  await api.dispose()

  await page.goto(`/creator/game/${game.id}`)

  // Add a station
  await page.getByRole('button', { name: /\+ Station/ }).click()

  // Wait for station to appear in the list
  await expect(page.getByRole('button', { name: /Bearbeiten/ })).toBeVisible({ timeout: 5000 })

  // Start button should now be enabled (station has default puzzle config)
  const startBtn = page.getByRole('button', { name: /Spiel starten/ })
  await expect(startBtn).toBeEnabled()
})

test('Creator: station editor shows minigame type selector', async ({ page }) => {
  const api = await request.newContext({ baseURL: API_BASE })

  const gameRes = await api.post('/api/games', { data: { name: 'Station Editor Test' } })
  const game = await gameRes.json()

  // Add a station via API
  await api.post(`/api/games/${game.id}/stations`, {
    data: {
      position: 1,
      image_path: null,
      mini_game_type: 'puzzle',
      mini_game_config: { type: 'puzzle', grid_size: 4 },
    },
  })
  const stationsRes = await api.get(`/api/games/${game.id}/stations`)
  const stations = await stationsRes.json()
  await api.dispose()

  // Navigate to station editor
  await page.goto(`/creator/game/${game.id}/station/${stations[0].id}`)

  // Minigame type buttons should be visible
  await expect(page.getByText('Puzzle')).toBeVisible()
  await expect(page.getByText('Zahlenrätsel')).toBeVisible()
  await expect(page.getByText('Labyrinth')).toBeVisible()
  await expect(page.getByText('Texträtsel')).toBeVisible()
  await expect(page.getByText('Bilderrätsel')).toBeVisible()

  // Back button navigates to game editor
  await page.getByRole('button', { name: /Zurück/ }).click()
  await expect(page).toHaveURL(new RegExp(`/creator/game/${game.id}$`))
})
