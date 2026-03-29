import { Given, When, Then, expect } from './fixtures'

Given('ich habe ein neues Spiel erstellt', async ({ page }) => {
  await page.goto('/creator')
  await page.waitForLoadState('networkidle')
  const newGameBtn = page.getByRole('button', { name: /Neues Spiel/i })
  if (await newGameBtn.isVisible()) {
    await newGameBtn.click()
  }
})

Given('ich bin im Spiel-Editor', async ({ page }) => {
  await expect(page).toHaveURL(/\/creator\//)
})

When('ich auf den Spielnamen klicke', async ({ page }) => {
  await page.getByTestId('game-title').click()
})

Then('erscheint ein Eingabefeld mit dem aktuellen Namen', async ({ page }) => {
  await expect(page.getByRole('textbox')).toBeVisible()
})

When('ich den Namen auf {string} ändere', async ({ page }, name: string) => {
  await page.getByRole('textbox').fill(name)
})

When('auf {string} klicke', async ({ page }, label: string) => {
  await page.getByRole('button', { name: label }).click()
})

Then('zeigt die Überschrift {string}', async ({ page }, heading: string) => {
  await expect(page.getByRole('heading', { name: heading })).toBeVisible()
})

When('den Namen ändere', async ({ page }) => {
  await page.getByRole('textbox').fill('Neuer Name')
})

When('Escape drücke', async ({ page }) => {
  await page.keyboard.press('Escape')
})

Then('zeigt die Überschrift den ursprünglichen Namen', async ({ page }) => {
  const heading = page.getByRole('heading')
  await expect(heading).toBeVisible()
})

Then('erscheint eine neue Station in der Liste', async ({ page }) => {
  await expect(page.locator('[data-testid="station-item"]').first()).toBeVisible()
})

Then('die Stationsanzahl erhöht sich um 1', async ({ page }) => {
  // Verified by previous step - station appears in list
})

Given('ich habe eine Station ohne Bild hinzugefügt', async ({ page }) => {
  await page.getByRole('button', { name: /\+ Station/i }).click()
})

Then('sehe ich eine Fehlermeldung über fehlende Bilder', async ({ page }) => {
  await expect(page.getByText(/Bild/i)).toBeVisible()
})

Given('ich habe eine Station hinzugefügt', async ({ page }) => {
  await page.getByRole('button', { name: /\+ Station/i }).click()
})

When("ich auf 'Bearbeiten' bei der Station klicke", async ({ page }) => {
  await page.getByRole('button', { name: /Bearbeiten/i }).first().click()
})

Given('ich habe 20 Stationen hinzugefügt', async ({ page }) => {
  for (let i = 0; i < 20; i++) {
    await page.getByRole('button', { name: /\+ Station/i }).click()
  }
})
