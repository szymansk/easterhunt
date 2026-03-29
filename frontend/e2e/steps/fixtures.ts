import { test as base } from 'playwright-bdd'
import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

export const API_BASE = 'http://localhost:8000'

type TestFixtures = {
  createdGameIds: string[]
}

const test = base.extend<TestFixtures>({
  createdGameIds: async ({}, use) => {
    const ids: string[] = []
    await use(ids)
    // Cleanup: delete all games created during this test
    for (const id of ids) {
      try {
        await fetch(`${API_BASE}/api/games/${id}`, { method: 'DELETE' })
      } catch { /* ignore */ }
    }
  },
})

export { test, expect }
export const { Given, When, Then } = createBdd(test)
