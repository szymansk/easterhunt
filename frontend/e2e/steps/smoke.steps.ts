import { createBdd } from 'playwright-bdd'
import { test, expect } from './fixtures'

const { Given, When, Then } = createBdd(test)

Given('die App ist geöffnet', async ({ page }) => {
  await page.goto('/')
})

Then('sehe ich den Titel {string}', async ({ page }, title: string) => {
  await expect(page).toHaveTitle(new RegExp(title))
})

Then('ich sehe den Button {string}', async ({ page }, label: string) => {
  await expect(page.getByRole('button', { name: label })).toBeVisible()
})

Then('ich sehe den Text {string}', async ({ page }, text: string) => {
  await expect(page.getByText(text, { exact: false })).toBeVisible()
})

When('ich auf {string} klicke', async ({ page }, label: string) => {
  await page.getByRole('button', { name: label }).click()
})

Then('bin ich auf der Seite {string}', async ({ page }, path: string) => {
  await expect(page).toHaveURL(new RegExp(path.replace(/\//g, '\\/') + '$'))
})

When('ich die URL {string} aufrufe', async ({ page }, path: string) => {
  await page.goto(path)
})
