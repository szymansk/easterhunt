import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import AssetPicker from './AssetPicker'
import * as api from '../../services/api'

vi.mock('../../services/api')

const mockItems = [
  { id: 'asset-egg', name: 'Osterei', category: 'oster-assets', image_url: '/media/content/images/egg.svg', metadata_json: {} },
  { id: 'asset-bunny', name: 'Hase', category: 'oster-assets', image_url: '/media/content/images/bunny.svg', metadata_json: {} },
  { id: 'asset-null', name: 'Kein Bild', category: 'oster-assets', image_url: null, metadata_json: {} },
]

beforeEach(() => {
  vi.mocked(api.listLibraryItems).mockResolvedValue(mockItems as never)
})

afterEach(() => {
  vi.clearAllMocks()
})

test('renders text input and toggle button', () => {
  render(<AssetPicker value="" onChange={vi.fn()} label="Bild" />)
  expect(screen.getByLabelText('Bild')).toBeTruthy()
  expect(screen.getByText(/Aus Bibliothek wählen/)).toBeTruthy()
})

test('opens grid and fetches items on first toggle', async () => {
  render(<AssetPicker value="" onChange={vi.fn()} />)
  fireEvent.click(screen.getByText(/Aus Bibliothek wählen/))
  await waitFor(() => expect(screen.getByTestId('asset-grid')).toBeTruthy())
  expect(vi.mocked(api.listLibraryItems)).toHaveBeenCalledTimes(1)
  // items with null image_url are filtered out
  expect(screen.queryByTitle('Kein Bild')).toBeNull()
  expect(screen.getByTitle('Osterei')).toBeTruthy()
})

test('clicking thumbnail calls onChange with image_url', async () => {
  const onChange = vi.fn()
  render(<AssetPicker value="" onChange={onChange} />)
  fireEvent.click(screen.getByText(/Aus Bibliothek wählen/))
  await waitFor(() => screen.getByTestId('asset-grid'))
  fireEvent.click(screen.getByTitle('Osterei'))
  expect(onChange).toHaveBeenCalledWith('/media/content/images/egg.svg')
})

test('active item has ring class', async () => {
  render(<AssetPicker value="/media/content/images/egg.svg" onChange={vi.fn()} />)
  fireEvent.click(screen.getByText(/Aus Bibliothek wählen/))
  await waitFor(() => screen.getByTestId('asset-grid'))
  const activeBtn = screen.getByTitle('Osterei').closest('button')!
  expect(activeBtn.className).toContain('ring-2')
})

test('does not re-fetch on second open', async () => {
  render(<AssetPicker value="" onChange={vi.fn()} />)
  const toggle = screen.getByText(/Aus Bibliothek wählen/)
  fireEvent.click(toggle)
  await waitFor(() => screen.getByTestId('asset-grid'))
  fireEvent.click(screen.getByText('Schließen'))
  fireEvent.click(screen.getByText(/Aus Bibliothek wählen/))
  await waitFor(() => screen.getByTestId('asset-grid'))
  expect(vi.mocked(api.listLibraryItems)).toHaveBeenCalledTimes(1)
})
