import { test } from 'playwright-bdd'
import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

export { test, expect }
export const { Given, When, Then } = createBdd(test)
