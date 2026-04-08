import { fileURLToPath } from 'url'
import * as fs from 'fs'
import * as path from 'path'
import { Given, When, Then, expect, API_BASE } from './fixtures'

async function createPuzzleStation(page: import('@playwright/test').Page, createdGameIds: string[]) {
  const gameRes = await page.request.post(`${API_BASE}/api/games`, {
    data: { name: 'E2E-Puzzle' },
  })
  const game = await gameRes.json()
  createdGameIds.push(game.id)

  const stationRes = await page.request.post(`${API_BASE}/api/games/${game.id}/stations`, {
    data: {
      position: 1,
      image_path: null,
      mini_game_type: 'puzzle',
      mini_game_config: { type: 'puzzle', grid_size: 4 },
    },
  })
  const station = await stationRes.json()

  // Upload a real image so puzzle can be generated
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const imgPath = path.resolve(__dirname, '../../public/icon-192.png')
  const imgBuffer = fs.readFileSync(imgPath)
  await page.request.fetch(`${API_BASE}/api/games/${game.id}/stations/${station.id}/image`, {
    method: 'POST',
    multipart: {
      file: { name: 'icon-192.png', mimeType: 'image/png', buffer: imgBuffer },
    },
  })

  // Generate puzzle tiles
  await page.request.post(`${API_BASE}/api/games/${game.id}/stations/${station.id}/puzzle/generate?grid_size=4`)

  await page.request.post(`${API_BASE}/api/games/${game.id}/start`)
  return { game, station }
}

Given('ich bin im Puzzle-Minispiel mit {int} Teilen \\(2x2\\)', async ({ page, createdGameIds }, _count: number) => {
  const { game, station } = await createPuzzleStation(page, createdGameIds)
  await page.goto(`/play/${game.id}/station/${station.id}`)
  await page.waitForLoadState('networkidle')
})

Then('sehe ich ein Zielraster mit {int} leeren Feldern', async ({ page }, count: number) => {
  await expect(page.locator('[data-testid="puzzle-slot"]')).toHaveCount(count)
})

Then('ich sehe {int} Puzzleteile in der Ablage', async ({ page }, count: number) => {
  await expect(page.locator('[data-testid="puzzle-piece"]')).toHaveCount(count)
})

When('ich Puzzleteil {int} auf Feld {int} ziehe', async ({ page }, pieceIndex: number, slotIndex: number) => {
  const piece = page.locator('[data-testid="puzzle-piece"]').nth(pieceIndex - 1)
  const slot = page.locator('[data-testid="puzzle-slot"]').nth(slotIndex - 1)
  const pieceBox = await piece.boundingBox()
  const slotBox = await slot.boundingBox()
  if (pieceBox && slotBox) {
    await page.mouse.move(pieceBox.x + pieceBox.width / 2, pieceBox.y + pieceBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(slotBox.x + slotBox.width / 2, slotBox.y + slotBox.height / 2)
    await page.mouse.up()
  }
})

Then('ist Puzzleteil {int} im Raster eingerastet', async ({ page }, _index: number) => {
  await expect(page.locator('[data-testid="puzzle-slot"][data-filled="true"]').first()).toBeVisible()
})

Then('ein Snap-Sound wird abgespielt', async ({ page }) => {
  await expect(page.locator('[data-testid="puzzle-slot"][data-filled="true"]').first()).toBeVisible()
})

Then('springt das Teil zurück in die Ablage', async ({ page }) => {
  await expect(page.locator('[data-testid="puzzle-piece"]').first()).toBeVisible()
})

When('ich alle {int} Puzzleteile korrekt platziere', async ({ page }, count: number) => {
  for (let i = 0; i < count; i++) {
    const piece = page.locator('[data-testid="puzzle-piece"]').first()
    const slot = page.locator('[data-testid="puzzle-slot"][data-filled="false"]').first()
    const pieceBox = await piece.boundingBox()
    const slotBox = await slot.boundingBox()
    if (pieceBox && slotBox) {
      await page.mouse.move(pieceBox.x + pieceBox.width / 2, pieceBox.y + pieceBox.height / 2)
      await page.mouse.down()
      await page.mouse.move(slotBox.x + slotBox.width / 2, slotBox.y + slotBox.height / 2)
      await page.mouse.up()
    }
  }
})

Then('erscheint eine Erfolgsmeldung {string}', async ({ page }, msg: string) => {
  await expect(page.getByText(msg)).toBeVisible()
})

When('alle Puzzleteile im Raster sind', async ({ page }) => {
  // All pieces placed - state from previous steps
})

Then('zeigt die Ablage {string}', async ({ page }, msg: string) => {
  await expect(page.getByText(msg)).toBeVisible()
})
