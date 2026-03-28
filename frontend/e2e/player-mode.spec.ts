import { test, expect, request } from '@playwright/test'

const API_BASE = 'http://localhost:8000'

async function createGameWithTextRiddles() {
  const apiContext = await request.newContext({ baseURL: API_BASE })

  // Create a game
  const gameRes = await apiContext.post('/api/games', {
    data: { name: 'E2E Test Osterjagd' },
  })
  expect(gameRes.ok()).toBeTruthy()
  const game = await gameRes.json()

  // Create station 1 - text riddle
  const s1Res = await apiContext.post(`/api/games/${game.id}/stations`, {
    data: {
      position: 1,
      image_path: null,
      mini_game_type: 'text_riddle',
      mini_game_config: {
        question: 'Welche Farbe hat ein Osterei?',
        answer_mode: 'multiple_choice',
        options: ['Bunt', 'Schwarz', 'Grau'],
      },
    },
  })
  expect(s1Res.ok()).toBeTruthy()
  const station1 = await s1Res.json()

  // Create station 2 - text riddle
  const s2Res = await apiContext.post(`/api/games/${game.id}/stations`, {
    data: {
      position: 2,
      image_path: null,
      mini_game_type: 'text_riddle',
      mini_game_config: {
        question: 'Wer versteckt die Ostereier?',
        answer_mode: 'multiple_choice',
        options: ['Der Osterhase', 'Der Weihnachtsmann', 'Der Nikolaus'],
      },
    },
  })
  expect(s2Res.ok()).toBeTruthy()
  const station2 = await s2Res.json()

  // Start game
  const startRes = await apiContext.post(`/api/games/${game.id}/start`)
  expect(startRes.ok()).toBeTruthy()

  // Create progress
  const progressRes = await apiContext.post(`/api/games/${game.id}/progress`)
  expect(progressRes.ok()).toBeTruthy()

  await apiContext.dispose()
  return { game, station1, station2 }
}

test('Test 1: Player can see station list and station 1 is current', async ({ page }) => {
  const { game, station1 } = await createGameWithTextRiddles()

  await page.goto(`/play/${game.id}`)
  await expect(page.getByText('E2E Test Osterjagd')).toBeVisible()

  // Station 1 should be current (tappable)
  const s1Card = page.getByTestId('station-1')
  await expect(s1Card).toHaveAttribute('data-status', 'current')

  // Station 2 should be locked
  const s2Card = page.getByTestId('station-2')
  await expect(s2Card).toHaveAttribute('data-status', 'locked')

  // Tap station 1 → navigates to mini game
  await s1Card.click()
  await expect(page).toHaveURL(new RegExp(`/play/${game.id}/station/${station1.id}`))
})

test('Test 2: After completing station 1, station 2 is unlocked', async ({ page }) => {
  const { game, station1 } = await createGameWithTextRiddles()

  // Go directly to station 1
  await page.goto(`/play/${game.id}/station/${station1.id}`)

  // Text riddle renders question
  await expect(page.getByText('Welche Farbe hat ein Osterei?')).toBeVisible({ timeout: 10000 })

  // Click the first answer option (completes the station)
  await page.getByText('Bunt').click()

  // Success overlay appears
  await expect(page.getByText(/Super gemacht/)).toBeVisible({ timeout: 5000 })

  // After overlay auto-dismisses, navigated back to game view
  await expect(page).toHaveURL(new RegExp(`/play/${game.id}$`), { timeout: 8000 })

  // Station 1 now completed, station 2 now current
  const s1Card = page.getByTestId('station-1')
  await expect(s1Card).toHaveAttribute('data-status', 'completed', { timeout: 5000 })

  const s2Card = page.getByTestId('station-2')
  await expect(s2Card).toHaveAttribute('data-status', 'current', { timeout: 5000 })
})

test('Test 3: Completing all stations shows Game Completion Screen', async ({ page }) => {
  const { game, station1, station2 } = await createGameWithTextRiddles()

  // Complete station 1
  await page.goto(`/play/${game.id}/station/${station1.id}`)
  await expect(page.getByText('Welche Farbe hat ein Osterei?')).toBeVisible({ timeout: 10000 })
  await page.getByText('Bunt').click()
  await expect(page).toHaveURL(new RegExp(`/play/${game.id}$`), { timeout: 8000 })

  // Go to station 2
  const s2Card = page.getByTestId('station-2')
  await expect(s2Card).toHaveAttribute('data-status', 'current', { timeout: 5000 })
  await s2Card.click()
  await expect(page).toHaveURL(new RegExp(`/play/${game.id}/station/${station2.id}`))

  // Complete station 2
  await expect(page.getByText('Wer versteckt die Ostereier?')).toBeVisible({ timeout: 10000 })
  await page.getByText('Der Osterhase').click()

  // Game Completion Screen appears
  await expect(page.getByText(/Geschafft/)).toBeVisible({ timeout: 8000 })
  await expect(page.getByText(/Frohe Ostern/)).toBeVisible()
  await expect(page.getByText(/Nochmal spielen/)).toBeVisible()
}, { timeout: 30000 })
