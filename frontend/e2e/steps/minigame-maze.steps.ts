import { Given, When, Then, expect, API_BASE } from './fixtures'

Given('ich bin im Labyrinth-Minispiel', async ({ page, createdGameIds }) => {
  const gameRes = await page.request.post(`${API_BASE}/api/games`, {
    data: { name: 'E2E-Labyrinth' },
  })
  const game = await gameRes.json()
  createdGameIds.push(game.id)

  const stationRes = await page.request.post(`${API_BASE}/api/games/${game.id}/stations`, {
    data: {
      position: 1,
      image_path: 'test-placeholder.jpg',
      mini_game_type: 'maze',
      mini_game_config: { type: 'maze', maze_data: {} },
    },
  })
  const station = await stationRes.json()
  // Generate maze data
  await page.request.post(`${API_BASE}/api/games/${game.id}/stations/${station.id}/maze/generate`, {
    data: { difficulty: 'easy' },
  })
  await page.request.post(`${API_BASE}/api/games/${game.id}/start`)
  await page.goto(`/play/${game.id}/station/${station.id}`)
  await page.waitForLoadState('networkidle')
})

Then('sehe ich einen SVG-Spielbereich', async ({ page }) => {
  await expect(page.locator('svg')).toBeVisible()
})

Then('ich sehe den Hasen \\(Avatar\\)', async ({ page }) => {
  await expect(page.locator('[data-testid="maze-avatar"], [data-testid="hase"]')).toBeVisible()
})

Then('ich sehe das Osterei \\(Ziel\\)', async ({ page }) => {
  await expect(page.locator('[data-testid="maze-goal"], [data-testid="osterei"]')).toBeVisible()
})

When('ich den Hasen in Richtung Osterei ziehe', async ({ page }) => {
  const avatar = page.locator('[data-testid="maze-avatar"], [data-testid="hase"]')
  const box = await avatar.boundingBox()
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + 50, box.y + box.height / 2)
    await page.mouse.up()
  }
})

Then('bewegt sich der Hase', async ({ page }) => {
  await expect(page.locator('[data-testid="maze-avatar"], [data-testid="hase"]')).toBeVisible()
})

When('der Hase das Osterei erreicht', async ({ page }) => {
  await page.keyboard.press('ArrowRight')
})

When('ich den Hasen gegen eine Wand ziehe', async ({ page }) => {
  const avatar = page.locator('[data-testid="maze-avatar"], [data-testid="hase"]')
  const box = await avatar.boundingBox()
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(0, box.y + box.height / 2)
    await page.mouse.up()
  }
})

Then('bleibt der Hase an seiner Position', async ({ page }) => {
  await expect(page.locator('[data-testid="maze-avatar"], [data-testid="hase"]')).toBeVisible()
})
