import { Given, When, Then, expect } from './fixtures'

Given('ich bin im Zahlenrätsel-Minispiel', async ({ page }) => {
  await page.goto('/play')
})

Given('die Aufgabe lautet {string}', async ({ page }, _task: string) => {
  // State set by background
})

Given('die Distraktoren sind {string}, {string}', async ({ page }, _a: string, _b: string) => {
  // State set by background
})

Then('sehe ich die Aufgabe {string}', async ({ page }, task: string) => {
  await expect(page.getByText(task)).toBeVisible()
})

Then('ich sehe Zahlenbuttons', async ({ page }) => {
  await expect(page.locator('[data-testid="number-btn"]').first()).toBeVisible()
})

Then('die Antwortbuttons werden nach kurzer Zeit wieder aktiv', async ({ page }) => {
  await page.waitForTimeout(1000)
  await expect(page.locator('[data-testid="number-btn"]').first()).toBeEnabled()
})

Then('haben alle Zahlenbuttons eine Mindestgröße von {int}px', async ({ page }, size: number) => {
  const buttons = page.locator('[data-testid="number-btn"]')
  const count = await buttons.count()
  for (let i = 0; i < count; i++) {
    const box = await buttons.nth(i).boundingBox()
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(size)
      expect(box.height).toBeGreaterThanOrEqual(size)
    }
  }
})
