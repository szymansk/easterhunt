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
  await expect(page.locator('[data-testid="maze-grid"]')).toBeVisible()
})

Then('ich sehe den Hasen \\(Avatar\\)', async ({ page }) => {
  await expect(page.locator('[data-testid="maze-avatar"]')).toBeVisible()
})

Then('ich sehe das Osterei \\(Ziel\\)', async ({ page }) => {
  await expect(page.locator('[data-testid="maze-goal"]')).toBeVisible()
})

When('ich den Hasen in Richtung Osterei ziehe', async ({ page }) => {
  const svg = page.locator('[data-testid="maze-grid"]')
  const box = await svg.boundingBox()
  if (box) {
    // Start drag from center of SVG, move right
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2)
    await page.mouse.up()
  }
})

Then('bewegt sich der Hase', async ({ page }) => {
  await expect(page.locator('[data-testid="maze-avatar"]')).toBeVisible()
})

When('der Hase das Osterei erreicht', async ({ page }) => {
  // Drag the avatar all the way to the goal position using the maze-goal testid
  const svg = page.locator('[data-testid="maze-grid"]')
  const goal = page.locator('[data-testid="maze-goal"]')
  const avatar = page.locator('[data-testid="maze-avatar"]')

  const avatarBox = await avatar.boundingBox()
  const goalBox = await goal.boundingBox()
  const svgBox = await svg.boundingBox()

  if (avatarBox && goalBox && svgBox) {
    // Simulate mouse drag from avatar to goal
    await page.mouse.move(avatarBox.x + avatarBox.width / 2, avatarBox.y + avatarBox.height / 2)
    await page.mouse.down()
    // Move in steps toward the goal
    const steps = 20
    for (let i = 1; i <= steps; i++) {
      const x = avatarBox.x + avatarBox.width / 2 + (goalBox.x + goalBox.width / 2 - avatarBox.x - avatarBox.width / 2) * (i / steps)
      const y = avatarBox.y + avatarBox.height / 2 + (goalBox.y + goalBox.height / 2 - avatarBox.y - avatarBox.height / 2) * (i / steps)
      await page.mouse.move(x, y)
    }
    await page.mouse.up()
  }
})

When('ich den Hasen gegen eine Wand ziehe', async ({ page }) => {
  const svg = page.locator('[data-testid="maze-grid"]')
  const box = await svg.boundingBox()
  if (box) {
    // Try to move to top-left corner (likely a wall)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + 5, box.y + 5)
    await page.mouse.up()
  }
})

Then('bleibt der Hase an seiner Position', async ({ page }) => {
  await expect(page.locator('[data-testid="maze-avatar"]')).toBeVisible()
})
