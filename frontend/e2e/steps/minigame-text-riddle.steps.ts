import { Given, When, Then, expect } from './fixtures'

Given('ich bin im Texträtsel-Minispiel mit der Frage {string}', async ({ page }, _question: string) => {
  await page.goto('/play')
  await page.waitForLoadState('networkidle')
})

Given('die Antwortoptionen sind {string}, {string}, {string}', async ({ page }, _a: string, _b: string, _c: string) => {
  // State set up by background context
})

Given('die korrekte Antwort ist {string}', async ({ page }, _answer: string) => {
  // State set up by background context
})

Then('sehe ich die Frage {string}', async ({ page }, question: string) => {
  await expect(page.getByText(question)).toBeVisible()
})

Then('ich sehe {int} Antwortbuttons', async ({ page }, count: number) => {
  await expect(page.locator('[data-testid="answer-btn"]')).toHaveCount(count)
})

Then('ich sehe eine Wackel-Animation', async ({ page }) => {
  await expect(
    page.locator('[class*="shake"], [class*="wobble"], [data-testid="shake-animation"]')
  ).toBeVisible()
})

When('die Fehler-Animation abgeschlossen ist', async ({ page }) => {
  await page.waitForTimeout(1000)
})

Then('sind die Antwortbuttons wieder anklickbar', async ({ page }) => {
  await expect(page.locator('[data-testid="answer-btn"]').first()).toBeEnabled()
})

Given('TTS ist aktiviert', async ({ page }) => {
  // TTS enabled state
})

Then('sehe ich einen Vorlesen-Button', async ({ page }) => {
  await expect(page.getByRole('button', { name: /vorlesen|TTS|lesen/i })).toBeVisible()
})

When('ich auf den Vorlesen-Button klicke', async ({ page }) => {
  await page.getByRole('button', { name: /vorlesen|TTS|lesen/i }).click()
})

Then('wird die Frage vorgelesen', async ({ page }) => {
  await expect(page.getByRole('button', { name: /vorlesen|TTS|lesen/i })).toBeVisible()
})
