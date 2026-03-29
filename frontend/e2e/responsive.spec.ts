import { test, expect } from '@playwright/test'

const WIDTHS = [375, 430]

for (const width of WIDTHS) {
  test(`no horizontal scroll at ${width}px — home page`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })
    await page.goto('/')
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(width)
  })

  test(`no horizontal scroll at ${width}px — creator list`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 })
    await page.goto('/creator')
    // Page may show loading or empty state — both should fit without horizontal scroll
    await page.waitForLoadState('networkidle').catch(() => {})
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(width)
  })
}
