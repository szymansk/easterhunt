/**
 * Shared step definitions reused across multiple feature files.
 */
import { Given, When, Then, expect } from './fixtures'

// ── Navigation ──────────────────────────────────────────────────────────────

Given('die App ist geöffnet', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
})

When('ich auf {string} klicke', async ({ page }, label: string) => {
  await page.getByRole('button', { name: label }).click()
})

When('ich die URL {string} aufrufe', async ({ page }, path: string) => {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
})

Then('bin ich auf der Seite {string}', async ({ page }, path: string) => {
  await expect(page).toHaveURL(new RegExp(path.replace(/\//g, '\\/') + '$'))
})

// ── Visibility ───────────────────────────────────────────────────────────────

Then('sehe ich den Titel {string}', async ({ page }, title: string) => {
  await expect(page).toHaveTitle(new RegExp(title))
})

Then('ich sehe den Button {string}', async ({ page }, label: string) => {
  await expect(page.getByRole('button', { name: label })).toBeVisible()
})

Then('ich sehe den Text {string}', async ({ page }, text: string) => {
  await expect(page.getByText(text, { exact: false })).toBeVisible()
})

Then('sehe ich den Text {string}', async ({ page }, text: string) => {
  await expect(page.getByText(text, { exact: false })).toBeVisible()
})

Then('sehe ich die Überschrift {string}', async ({ page }, heading: string) => {
  await expect(page.getByRole('heading', { name: heading })).toBeVisible()
})

Then('erscheint ein Bestätigungs-Dialog', async ({ page }) => {
  await expect(page.getByRole('dialog')).toBeVisible()
})

Then('ist das Modal nicht mehr sichtbar', async ({ page }) => {
  await expect(page.getByRole('dialog')).not.toBeVisible()
})

// ── Minigame common ──────────────────────────────────────────────────────────

Then('die Station wird als abgeschlossen markiert', async ({ page }) => {
  await expect(page.locator('[data-testid="station-complete"]')).toBeVisible()
})

Then('die Station bleibt unabgeschlossen', async ({ page }) => {
  await expect(page.locator('[data-testid="station-complete"]')).not.toBeVisible()
})

Then('wird der Button grün markiert', async ({ page }) => {
  await expect(
    page.locator('[data-testid="answer-btn"].correct, [data-testid="answer-btn"][data-state="correct"], [data-testid="number-btn"].correct, [data-testid="number-btn"][data-state="correct"]')
  ).toBeVisible()
})

Then('wird der Button rot markiert', async ({ page }) => {
  await expect(
    page.locator('[data-testid="answer-btn"].wrong, [data-testid="answer-btn"][data-state="wrong"], [data-testid="number-btn"].wrong, [data-testid="number-btn"][data-state="wrong"]')
  ).toBeVisible()
})

Then('es erscheint eine Wackel-Animation', async ({ page }) => {
  await expect(
    page.locator('[class*="shake"], [class*="wobble"], [data-testid="shake-animation"]')
  ).toBeVisible()
})

Then('erscheint eine Erfolgsmeldung', async ({ page }) => {
  await expect(page.getByText(/geschafft|gewonnen|Ziel|gefunden/i)).toBeVisible()
})

// ── Editor / Creator shared ───────────────────────────────────────────────────

Then('bin ich im Spiel-Editor', async ({ page }) => {
  await expect(page).toHaveURL(/\/creator\/[^/]+$/)
})

Then('bin ich im Stations-Editor', async ({ page }) => {
  await expect(page).toHaveURL(/\/station\//)
})

Then('ist der Button {string} deaktiviert', async ({ page }, label: string) => {
  await expect(page.getByRole('button', { name: label })).toBeDisabled()
})

Then('erscheint ein Modal mit dem Titel {string}', async ({ page }, title: string) => {
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog').getByText(title)).toBeVisible()
})

Then('ich sehe die Option {string}', async ({ page }, option: string) => {
  await expect(page.getByText(option)).toBeVisible()
})
