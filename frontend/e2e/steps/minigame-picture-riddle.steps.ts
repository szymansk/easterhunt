import { Given, When, Then, expect } from './fixtures'

Given('ich bin im Bilderrätsel-Minispiel', async ({ page }) => {
  await page.goto('/play')
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
  await expect(page.locator('[data-testid="answer-img"]')).toHaveCount(count)
})

When('ich auf das richtige Antwortbild tippe', async ({ page }) => {
  await page.locator('[data-testid="answer-img"][data-correct="true"]').click()
})

Then('wird das Bild grün umrandet', async ({ page }) => {
  await expect(
    page.locator('[data-testid="answer-img"].correct, [data-testid="answer-img"][data-state="correct"]')
  ).toBeVisible()
})

When('ich auf ein falsches Antwortbild tippe', async ({ page }) => {
  await page.locator('[data-testid="answer-img"][data-correct="false"]').first().click()
})

Then('wird das Bild rot umrandet', async ({ page }) => {
  await expect(
    page.locator('[data-testid="answer-img"].wrong, [data-testid="answer-img"][data-state="wrong"]')
  ).toBeVisible()
})

Then('nach kurzer Zeit sind alle Bilder wieder auswählbar', async ({ page }) => {
  await page.waitForTimeout(1000)
  await expect(page.locator('[data-testid="answer-img"]').first()).toBeEnabled()
})

Then('haben alle Antwortbilder eine Mindestgröße von {int}px', async ({ page }, size: number) => {
  const imgs = page.locator('[data-testid="answer-img"]')
  const count = await imgs.count()
  for (let i = 0; i < count; i++) {
    const box = await imgs.nth(i).boundingBox()
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(size)
      expect(box.height).toBeGreaterThanOrEqual(size)
    }
  }
})
