import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import LibraryBrowser from './LibraryBrowser'
import * as api from '../../services/api'
import type { LibraryTask } from '../../types'
import { MiniGameType } from '../../types'

vi.mock('../../services/api')

const mockCategories = ['basteln', 'essen', 'spielzeug']
const mockTasks: LibraryTask[] = [
  {
    id: 'task-1',
    mini_game_type: MiniGameType.picture_riddle,
    category: 'spielzeug',
    reference_items: [
      { id: 'item-1', name: 'Ball', category: 'spielzeug', image_url: '/media/ball.svg', metadata_json: {} },
    ],
    correct_answer: { id: 'item-2', name: 'Auto', category: 'spielzeug', image_url: '/media/car.svg', metadata_json: {} },
    answer_options: [
      { id: 'item-2', name: 'Auto', category: 'spielzeug', image_url: '/media/car.svg', metadata_json: {} },
      { id: 'item-3', name: 'Teddy', category: 'spielzeug', image_url: '/media/teddy.svg', metadata_json: {} },
    ],
    question: null,
    options_json: null,
  },
]

beforeEach(() => {
  vi.mocked(api.listLibraryCategories).mockResolvedValue(mockCategories)
  vi.mocked(api.listLibraryTasks).mockResolvedValue(mockTasks)
})

afterEach(() => {
  vi.clearAllMocks()
})

test('does not render when closed', () => {
  render(
    <LibraryBrowser isOpen={false} onClose={() => {}} onSelect={() => {}} />
  )
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('renders dialog when open', async () => {
  render(
    <LibraryBrowser isOpen={true} onClose={() => {}} onSelect={() => {}} />
  )
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(screen.getByText('Bibliothek')).toBeInTheDocument()
})

test('renders category tabs', async () => {
  render(
    <LibraryBrowser isOpen={true} onClose={() => {}} onSelect={() => {}} />
  )
  await waitFor(() => {
    expect(screen.getByRole('tab', { name: 'spielzeug' })).toBeInTheDocument()
  })
  expect(screen.getByRole('tab', { name: 'essen' })).toBeInTheDocument()
})

test('renders task items in grid', async () => {
  render(
    <LibraryBrowser isOpen={true} onClose={() => {}} onSelect={() => {}} />
  )
  await waitFor(() => {
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })
  const options = screen.getAllByRole('option')
  expect(options.length).toBe(1)
})

test('search filters tasks by name', async () => {
  const multiTasks: LibraryTask[] = [
    ...mockTasks,
    {
      id: 'task-2',
      mini_game_type: MiniGameType.picture_riddle,
      category: 'essen',
      reference_items: [
        { id: 'item-apple', name: 'Apfel', category: 'essen', image_url: '/media/apple.svg', metadata_json: {} },
      ],
      correct_answer: null,
      answer_options: [],
      question: null,
      options_json: null,
    },
  ]
  ;(api.listLibraryTasks as Mock).mockResolvedValue(multiTasks)

  render(
    <LibraryBrowser isOpen={true} onClose={() => {}} onSelect={() => {}} />
  )
  await waitFor(() => {
    expect(screen.getAllByRole('option').length).toBe(2)
  })

  const searchInput = screen.getByPlaceholderText('Suchen…')
  fireEvent.change(searchInput, { target: { value: 'spielzeug' } })
  expect(screen.getAllByRole('option').length).toBe(1)
})

test('selecting a task shows preview', async () => {
  render(
    <LibraryBrowser isOpen={true} onClose={() => {}} onSelect={() => {}} />
  )
  await waitFor(() => {
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0)
  })
  const option = screen.getAllByRole('option')[0]
  fireEvent.click(option)
  expect(screen.getByText('Vorschau')).toBeInTheDocument()
})

test('confirm button disabled without selection', async () => {
  render(
    <LibraryBrowser isOpen={true} onClose={() => {}} onSelect={() => {}} />
  )
  await waitFor(() => screen.getByText('Auswählen'))
  expect(screen.getByText('Auswählen')).toBeDisabled()
})

test('selecting task and confirming calls onSelect', async () => {
  const onSelect = vi.fn()
  render(
    <LibraryBrowser isOpen={true} onClose={() => {}} onSelect={onSelect} />
  )
  await waitFor(() => {
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0)
  })
  fireEvent.click(screen.getAllByRole('option')[0])
  fireEvent.click(screen.getByText('Auswählen'))
  expect(onSelect).toHaveBeenCalledWith(mockTasks[0])
})

test('cancel closes without calling onSelect', async () => {
  const onClose = vi.fn()
  const onSelect = vi.fn()
  render(
    <LibraryBrowser isOpen={true} onClose={onClose} onSelect={onSelect} />
  )
  await waitFor(() => screen.getByText('Abbrechen'))
  fireEvent.click(screen.getByText('Abbrechen'))
  expect(onClose).toHaveBeenCalled()
  expect(onSelect).not.toHaveBeenCalled()
})
