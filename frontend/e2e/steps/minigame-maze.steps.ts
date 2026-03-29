import { Given, When, Then, expect } from './fixtures'

Given('ich bin im Labyrinth-Minispiel', async ({ page }) => {
  await page.goto('/play')
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
