import { Given, When, Then, expect, API_BASE } from './fixtures'

Given('ich bin im Bilderrätsel-Minispiel', async ({ page, createdGameIds }) => {
  const gameRes = await page.request.post(`${API_BASE}/api/games`, {
    data: { name: 'E2E-Bilderrätsel' },
  })
  const game = await gameRes.json()
  createdGameIds.push(game.id)

  const stationRes = await page.request.post(`${API_BASE}/api/games/${game.id}/stations`, {
    data: {
      position: 1,
      image_path: 'test-placeholder.jpg',
      mini_game_type: 'picture_riddle',
      mini_game_config: {
        type: 'picture_riddle',
        category: 'test',
        reference_items: [
          { image_url: 'img1.jpg', label: 'Ref 1' },
          { image_url: 'img2.jpg', label: 'Ref 2' },
        ],
        answer_options: [
          { image_url: 'ans1.jpg', label: 'Antwort 1', is_correct: true },
          { image_url: 'ans2.jpg', label: 'Antwort 2', is_correct: false },
          { image_url: 'ans3.jpg', label: 'Antwort 3', is_correct: false },
          { image_url: 'ans4.jpg', label: 'Antwort 4', is_correct: false },
        ],
      },
    },
  })
  const station = await stationRes.json()
  await page.request.post(`${API_BASE}/api/games/${game.id}/start`)
  await page.goto(`/play/${game.id}/station/${station.id}`)
  await page.waitForLoadState('networkidle')
})

Given('es werden {int} Referenzbilder angezeigt', async ({ page }, _count: number) => {
  // State set by background
})

Given('es werden {int} Antwortbilder im 2x2-Raster angezeigt', async ({ page }, _count: number) => {
  // State set by background
})

Then('sehe ich {int} Referenzbilder', async ({ page }, count: number) => {
  await expect(page.locator('[data-testid="reference-img"]')).toHaveCount(count)
})

Then('ich sehe {int} Antwortoptionen im Raster', async ({ page }, count: number) => {
  await expect(page.locator('[data-testid="answer-btn"]')).toHaveCount(count)
})

When('ich auf das richtige Antwortbild tippe', async ({ page }) => {
  await page.locator('[data-testid="answer-btn"][data-correct="true"]').click()
})

Then('wird das Bild grün umrandet', async ({ page }) => {
  await expect(
    page.locator('[data-testid="answer-btn"].correct, [data-testid="answer-btn"][data-state="correct"]')
  ).toBeVisible()
})

When('ich auf ein falsches Antwortbild tippe', async ({ page }) => {
  await page.locator('[data-testid="answer-btn"][data-correct="false"]').first().click()
})

Then('wird das Bild rot umrandet', async ({ page }) => {
  await expect(
    page.locator('[data-testid="answer-btn"].wrong, [data-testid="answer-btn"][data-state="wrong"]')
  ).toBeVisible()
})

Then('nach kurzer Zeit sind alle Bilder wieder auswählbar', async ({ page }) => {
  await page.waitForTimeout(1000)
  await expect(page.locator('[data-testid="answer-btn"]').first()).toBeEnabled()
})

Then('haben alle Antwortbilder eine Mindestgröße von {int}px', async ({ page }, size: number) => {
  const imgs = page.locator('[data-testid="answer-btn"]')
  const count = await imgs.count()
  for (let i = 0; i < count; i++) {
    const box = await imgs.nth(i).boundingBox()
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(size)
      expect(box.height).toBeGreaterThanOrEqual(size)
    }
  }
})
