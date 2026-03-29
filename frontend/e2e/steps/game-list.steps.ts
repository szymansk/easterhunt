import { Given, When, Then, expect } from './fixtures'

Given('ich bin auf der Creator-Startseite {string}', async ({ page }, path: string) => {
  await page.goto(path)
})

Then('werde ich zum Spiel-Editor weitergeleitet', async ({ page }) => {
  await expect(page).toHaveURL(/\/creator\//)
})

Then('das neue Spiel erscheint in der Liste', async ({ page }) => {
  await expect(page.locator('[data-testid="game-list-item"]').first()).toBeVisible()
})

Given('es existiert ein Spiel {string}', async ({ page }, name: string) => {
  await page.goto('/creator')
  const btn = page.getByRole('button', { name: /Neues Spiel/i })
  if (await btn.isVisible()) {
    await btn.click()
    const titleEl = page.getByTestId('game-title')
    if (await titleEl.isVisible()) {
      await titleEl.click()
      await page.getByRole('textbox').fill(name)
      const saveBtn = page.getByRole('button', { name: /Speichern/i })
      if (await saveBtn.isVisible()) await saveBtn.click()
    }
    await page.goto('/creator')
  }
})

Then('bin ich im Spiel-Editor für {string}', async ({ page }, _name: string) => {
  await expect(page).toHaveURL(/\/creator\//)
})

Then('ist {string} nicht mehr in der Liste', async ({ page }, name: string) => {
  await expect(page.getByText(name)).not.toBeVisible()
})

Then('ist {string} noch in der Liste', async ({ page }, name: string) => {
  await expect(page.getByText(name)).toBeVisible()
})

Given('es existiert ein Spiel im Status {string}', async ({ page }, _status: string) => {
  await page.goto('/creator')
  const btn = page.getByRole('button', { name: /Neues Spiel/i })
  if (await btn.isVisible()) {
    await btn.click()
    await page.goto('/creator')
  }
})

Then('sehe ich ein Status-Badge mit {string}', async ({ page }, status: string) => {
  await expect(page.getByText(status)).toBeVisible()
})
