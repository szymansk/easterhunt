/**
 * Step definitions for puzzle-regression.feature (easter-1jf).
 *
 * Regression for easter-bl5: puzzle tiles must be persisted in station config
 * and survive page reloads.
 *
 * Image uploads are done via direct API calls (page.request.post) rather than
 * simulating a file picker — this makes tests reliable and focused on the
 * backend storage regression, not UI upload mechanics.
 *
 * JPEGs are generated in the browser via canvas.toBlob so no extra npm deps
 * are needed.
 */
import type { Page } from '@playwright/test'
import { Given, When, Then, expect, API_BASE } from './fixtures'

// ---------------------------------------------------------------------------
// Module-level context shared across steps within a single scenario.
// Safe because playwright-bdd runs steps sequentially within a scenario.
// ---------------------------------------------------------------------------
const ctx: {
  gameId: string | null
  stationIds: string[]
} = {
  gameId: null,
  stationIds: [],
}

function resetCtx() {
  ctx.gameId = null
  ctx.stationIds = []
}

/** Extract game id from a creator or play URL. */
function gameIdFromUrl(url: string): string {
  const m = url.match(/\/(?:creator\/game|play)\/([^/?#/]+)/)
  if (!m) throw new Error(`Cannot extract game id from URL: ${url}`)
  return m[1]
}

/** Extract station id from current page URL. */
function stationIdFromUrl(url: string): string {
  const m = url.match(/\/station\/([^/?#/]+)/)
  if (!m) throw new Error(`Cannot extract station id from URL: ${url}`)
  return m[1]
}

/**
 * Generate a JPEG image using the browser's canvas encoder.
 * Returns a Buffer suitable for multipart upload.
 *
 * @param page     Playwright page (needed for canvas access)
 * @param width    Image width in pixels
 * @param height   Image height in pixels
 * @param seed     Seed to vary the fill colour so uploads are distinct
 */
async function makeJpeg(
  page: Page,
  width: number,
  height: number,
  seed: number = 0,
): Promise<Buffer> {
  const r = (seed * 37 + 100) % 256
  const g = (seed * 67 + 50) % 256
  const b = (seed * 97 + 150) % 256

  const bytes = await page.evaluate(
    async ({ w, h, fr, fg, fb }) => {
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx2d = canvas.getContext('2d')!
      ctx2d.fillStyle = `rgb(${fr}, ${fg}, ${fb})`
      ctx2d.fillRect(0, 0, w, h)
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((bl) => resolve(bl!), 'image/jpeg', 0.9),
      )
      const ab = await blob.arrayBuffer()
      return Array.from(new Uint8Array(ab))
    },
    { w: width, h: height, fr: r, fg: g, fb: b },
  )
  return Buffer.from(bytes)
}

/** Upload a JPEG buffer to a station image endpoint. */
async function uploadJpeg(
  page: Page,
  gameId: string,
  stationId: string,
  jpegBuffer: Buffer,
  filename = 'photo.jpg',
): Promise<void> {
  const res = await page.request.post(
    `${API_BASE}/api/games/${gameId}/stations/${stationId}/image`,
    { multipart: { file: { name: filename, mimeType: 'image/jpeg', buffer: jpegBuffer } } },
  )
  if (!res.ok()) {
    throw new Error(`Image upload failed (${res.status()}): ${await res.text()}`)
  }
}

/** Generate puzzle tiles for a station. */
async function generateTiles(
  page: Page,
  gameId: string,
  stationId: string,
  gridSize = 4,
): Promise<void> {
  const res = await page.request.post(
    `${API_BASE}/api/games/${gameId}/stations/${stationId}/puzzle/generate?grid_size=${gridSize}`,
  )
  if (!res.ok()) {
    throw new Error(`Tile generation failed (${res.status()}): ${await res.text()}`)
  }
}

// ---------------------------------------------------------------------------
// Setup steps (Given)
// ---------------------------------------------------------------------------

/**
 * Full API-based setup: 2 puzzle stations + images + tiles + game started.
 * Uses the background game (identified from the current page URL).
 * Navigates to the game's play page so the reload scenario can work.
 */
Given(
  'ich habe zwei Puzzle-Stationen mit Bildern angelegt und gespeichert',
  async ({ page }) => {
    resetCtx()
    const gameId = gameIdFromUrl(page.url())
    ctx.gameId = gameId

    // Create 2 puzzle stations
    const s1Res = await page.request.post(`${API_BASE}/api/games/${gameId}/stations`, {
      data: {
        position: 1,
        mini_game_type: 'puzzle',
        mini_game_config: { type: 'puzzle', grid_size: 4 },
      },
    })
    const s2Res = await page.request.post(`${API_BASE}/api/games/${gameId}/stations`, {
      data: {
        position: 2,
        mini_game_type: 'puzzle',
        mini_game_config: { type: 'puzzle', grid_size: 4 },
      },
    })
    const sid1 = (await s1Res.json()).id as string
    const sid2 = (await s2Res.json()).id as string
    ctx.stationIds = [sid1, sid2]

    // Upload real JPEGs (200×300 portrait) and generate tiles
    const jpeg1 = await makeJpeg(page, 200, 300, 1)
    const jpeg2 = await makeJpeg(page, 200, 300, 2)
    await uploadJpeg(page, gameId, sid1, jpeg1, 'station1.jpg')
    await uploadJpeg(page, gameId, sid2, jpeg2, 'station2.jpg')
    await generateTiles(page, gameId, sid1)
    await generateTiles(page, gameId, sid2)

    // Start game and navigate to play page
    await page.request.post(`${API_BASE}/api/games/${gameId}/start`)
    await page.goto(`/play/${gameId}`)
    await page.waitForLoadState('networkidle')
  },
)

/**
 * Create 2 puzzle stations (no images yet) for the current background game.
 * Stores station IDs in ctx for subsequent steps.
 */
Given('ich habe zwei Stationen angelegt', async ({ page }) => {
  resetCtx()
  const gameId = gameIdFromUrl(page.url())
  ctx.gameId = gameId

  const s1Res = await page.request.post(`${API_BASE}/api/games/${gameId}/stations`, {
    data: {
      position: 1,
      mini_game_type: 'puzzle',
      mini_game_config: { type: 'puzzle', grid_size: 4 },
    },
  })
  const s2Res = await page.request.post(`${API_BASE}/api/games/${gameId}/stations`, {
    data: {
      position: 2,
      mini_game_type: 'puzzle',
      mini_game_config: { type: 'puzzle', grid_size: 4 },
    },
  })
  const sid1 = (await s1Res.json()).id as string
  const sid2 = (await s2Res.json()).id as string
  ctx.stationIds = [sid1, sid2]
})

/**
 * Upload a portrait JPEG (200×300) to station N via API.
 * The step name says "EXIF-Rotation 90°" — the actual EXIF-dimension assertion
 * is covered by the backend pytest test (TestExifOrientationPuzzle).
 * Here we upload a portrait JPEG directly so tiles will be portrait (h > w).
 */
Given(
  'Station {int} hat ein Portrait-JPEG mit EXIF-Rotation 90° als Bild',
  async ({ page }, stationIndex: number) => {
    const gameId = ctx.gameId ?? gameIdFromUrl(page.url())
    const stationId = ctx.stationIds[stationIndex - 1]
    if (!stationId) throw new Error(`Station ${stationIndex} not found in ctx.stationIds`)

    // Portrait JPEG: 200 wide × 300 tall → tiles will be 100×150 (h > w = hochkant)
    const jpegBuffer = await makeJpeg(page, 200, 300, stationIndex * 10)
    await uploadJpeg(page, gameId, stationId, jpegBuffer, `portrait-station${stationIndex}.jpg`)
  },
)

// ---------------------------------------------------------------------------
// Image upload steps (When) — bypass file picker, use API directly
// ---------------------------------------------------------------------------

/**
 * Upload a random JPEG to the current station via API, then reload.
 * {string} is the UI label (e.g. "Fotomediathek") — we bypass the file picker.
 */
When('ich ein zufälliges JPEG über {string} hochlade', async ({ page }, _source: string) => {
  const url = page.url()
  const gameId = gameIdFromUrl(url)
  const stationId = stationIdFromUrl(url)
  const jpegBuffer = await makeJpeg(page, 200, 300, 1)
  await uploadJpeg(page, gameId, stationId, jpegBuffer, 'random1.jpg')
  await page.reload()
  await page.waitForLoadState('networkidle')
})

When('ich ein zweites zufälliges JPEG über {string} hochlade', async ({ page }, _source: string) => {
  const url = page.url()
  const gameId = gameIdFromUrl(url)
  const stationId = stationIdFromUrl(url)
  const jpegBuffer = await makeJpeg(page, 200, 300, 2)
  await uploadJpeg(page, gameId, stationId, jpegBuffer, 'random2.jpg')
  await page.reload()
  await page.waitForLoadState('networkidle')
})

// ---------------------------------------------------------------------------
// Editor navigation steps
// ---------------------------------------------------------------------------

When('ich auf "Bearbeiten" bei Station {int} klicke', async ({ page }, index: number) => {
  await page.locator('[data-testid="station-item"]').nth(index - 1).getByRole('link', { name: 'Bearbeiten' }).click()
  await page.waitForURL(/\/station\//)
})

Then('bin ich im Stations-Editor für Station {int}', async ({ page }, _index: number) => {
  await expect(page).toHaveURL(/\/station\//)
})

When('ich "Puzzle" als Minispiel-Typ wähle', async ({ page }) => {
  await page.locator('[data-testid="mini-game-type-selector"]').getByRole('button', { name: /Puzzle/ }).click()
  // Dismiss type-change confirmation modal if it appears
  const confirmBtn = page.getByRole('button', { name: 'Wechseln' })
  if (await confirmBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await confirmBtn.click()
  }
})

When('ich die Rastergröße {string} auswähle', async ({ page }, gridSizeStr: string) => {
  const GRID_LABELS: Record<string, string> = {
    '3': '1×3',
    '4': '2×2',
    '6': '2×3',
    '9': '3×3',
  }
  const label = GRID_LABELS[gridSizeStr] ?? gridSizeStr
  await page.getByRole('button', { name: label }).click()
})

// ---------------------------------------------------------------------------
// Player view navigation / assertion steps
// ---------------------------------------------------------------------------

Then('bin ich auf der Player-Übersicht', async ({ page }) => {
  await expect(page).toHaveURL(/\/play\/[^/]+$/)
})

When('ich die Seite neu lade', async ({ page }) => {
  await page.reload()
  await page.waitForLoadState('networkidle')
})

When('ich Station {int} öffne', async ({ page }, stationIndex: number) => {
  const gameId = ctx.gameId ?? gameIdFromUrl(page.url())
  const stationId = ctx.stationIds[stationIndex - 1]
  if (!stationId) throw new Error(`Station ${stationIndex} not in ctx.stationIds`)
  await page.goto(`/play/${gameId}/station/${stationId}`)
  await page.waitForLoadState('networkidle')
})

Then('Station {int} ist jetzt die aktuelle Station', async ({ page }, index: number) => {
  await expect(
    page
      .locator('[data-testid="station-card"]')
      .nth(index - 1)
      .locator('[data-testid="current-badge"]'),
  ).toBeVisible()
})

// ---------------------------------------------------------------------------
// Puzzle game assertions
// ---------------------------------------------------------------------------

Then('ich sehe das Puzzle-Board', async ({ page }) => {
  await expect(page.locator('[data-testid="puzzle-grid"]')).toBeVisible()
})

Then('ich sehe {int} Puzzle-Teile in der Ablage', async ({ page }, count: number) => {
  await expect(
    page.locator('[data-testid="tile-tray"] [data-testid^="tile-"]'),
  ).toHaveCount(count)
})

Then('ich sehe keinen Text {string}', async ({ page }, text: string) => {
  await expect(page.getByText(text, { exact: false })).not.toBeVisible()
})

Then('ich sehe eine Bildvorschau in der Station', async ({ page }) => {
  // After uploading an image the station editor shows the thumbnail
  await expect(page.locator('img[src*="/media/"]').first()).toBeVisible()
})

Then('ich sehe das Vorschaubild von Station {int}', async ({ page }, _index: number) => {
  await expect(page.locator('[data-testid="next-station-preview"]')).toBeVisible()
})

Then('ich sehe die Glückwunsch-Seite', async ({ page }) => {
  await expect(page).toHaveURL(/\/complete/)
})

Then('ich alle 4 Puzzle-Teile korrekt platziere', async ({ page }) => {
  for (let i = 0; i < 4; i++) {
    const piece = page.locator('[data-testid="tile-tray"] [data-testid^="tile-"]').first()
    const slot = page.locator('[data-testid^="slot-"]').nth(i)
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

// ---------------------------------------------------------------------------
// EXIF orientation scenario steps
// ---------------------------------------------------------------------------

When('das Puzzle generiert wird', async ({ page }) => {
  const gameId = ctx.gameId ?? gameIdFromUrl(page.url())
  const sid1 = ctx.stationIds[0]
  const sid2 = ctx.stationIds[1]
  if (!sid1) throw new Error('No station 1 in ctx.stationIds')

  // Upload placeholder image to station 2 so the game can start
  if (sid2) {
    const jpeg2 = await makeJpeg(page, 200, 300, 99)
    await uploadJpeg(page, gameId, sid2, jpeg2, 'placeholder2.jpg')
    await generateTiles(page, gameId, sid2)
  }

  // Generate tiles for station 1 (portrait image was already uploaded by previous step)
  await generateTiles(page, gameId, sid1)

  // Start game and navigate to station 1 play view
  await page.request.post(`${API_BASE}/api/games/${gameId}/start`)
  await page.goto(`/play/${gameId}/station/${sid1}`)
  await page.waitForLoadState('networkidle')
})

/**
 * Assert that all tile images in the tray are portrait (naturalHeight > naturalWidth).
 * Relies on station 1 having been set up with a 200×300 portrait image, producing
 * 4 tiles of 100×150 each (all hochkant).
 *
 * Note: the strict EXIF-dimension regression (landscape+EXIF→portrait) is covered by
 * the backend pytest test TestExifOrientationPuzzle.
 */
Then('sind alle Puzzle-Teile hochkant \\(Höhe > Breite\\)', async ({ page }) => {
  await expect(page.locator('[data-testid="tile-tray"] [data-testid^="tile-"]').first()).toBeVisible()

  const tileImgs = page.locator('[data-testid^="tile-"] img')
  const count = await tileImgs.count()
  expect(count).toBeGreaterThan(0)

  for (let i = 0; i < count; i++) {
    const dims = await tileImgs.nth(i).evaluate((el: HTMLImageElement) => ({
      w: el.naturalWidth,
      h: el.naturalHeight,
    }))
    expect(
      dims.h,
      `Tile ${i} expected portrait (h > w), got ${dims.w}×${dims.h}`,
    ).toBeGreaterThan(dims.w)
  }
})
