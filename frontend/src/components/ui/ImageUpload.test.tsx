import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import ImageUpload from './ImageUpload'

// ---------------------------------------------------------------------------
// Mock XMLHttpRequest to simulate uploads
// ---------------------------------------------------------------------------

function createMockXHR(
  status: number,
  responseText: string,
  triggerProgressEvents = false,
) {
  const uploadListeners: Record<string, ((e: ProgressEvent) => void)[]> = {}
  const listeners: Record<string, ((e: Event) => void)[]> = {}

  const mockUpload = {
    addEventListener: vi.fn((type: string, fn: (e: ProgressEvent) => void) => {
      uploadListeners[type] = uploadListeners[type] ?? []
      uploadListeners[type].push(fn)
    }),
  }

  const mockXHR = {
    upload: mockUpload,
    addEventListener: vi.fn((type: string, fn: (e: Event) => void) => {
      listeners[type] = listeners[type] ?? []
      listeners[type].push(fn)
    }),
    open: vi.fn(),
    send: vi.fn(() => {
      if (triggerProgressEvents) {
        const progressEvent = { lengthComputable: true, loaded: 50, total: 100 } as ProgressEvent
        uploadListeners['progress']?.forEach((fn) => fn(progressEvent))
      }
      // Simulate async completion
      setTimeout(() => {
        Object.defineProperty(mockXHR, 'status', { value: status, configurable: true })
        Object.defineProperty(mockXHR, 'responseText', { value: responseText, configurable: true })
        listeners['load']?.forEach((fn) => fn(new Event('load')))
      }, 0)
    }),
    status: 0,
    responseText: '',
  }

  return mockXHR
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const DEFAULT_PROPS = {
  gameId: 'game-1',
  stationId: 'station-1',
  onUploaded: vi.fn(),
}

describe('ImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset URL.createObjectURL mock
    ;(globalThis as typeof globalThis & { URL: typeof URL }).URL.createObjectURL = vi.fn(() => 'blob:fake-url')
    ;(globalThis as typeof globalThis & { URL: typeof URL }).URL.revokeObjectURL = vi.fn()
  })

  it('shows placeholder when no image provided', () => {
    render(<ImageUpload {...DEFAULT_PROPS} />)
    expect(screen.getByText(/Bild auswählen oder Kamera/i)).toBeInTheDocument()
  })

  it('shows preview when currentImageUrl is provided', () => {
    render(<ImageUpload {...DEFAULT_PROPS} currentImageUrl="/media/test.jpg" />)
    const img = screen.getByRole('img', { name: /Stationsbild/i })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/media/test.jpg')
  })

  it('file input has accept=image/* and capture=environment', () => {
    render(<ImageUpload {...DEFAULT_PROPS} />)
    const input = screen.getByLabelText(/Bild auswählen/i)
    expect(input).toHaveAttribute('accept', 'image/*')
    expect(input).toHaveAttribute('capture', 'environment')
  })

  it('calls onUploaded after successful upload', async () => {
    const mockXHR = createMockXHR(
      201,
      JSON.stringify({ image_path: '/media/img.jpg', thumbnail_path: '/media/thumb.jpg' }),
    )
    vi.spyOn(window, 'XMLHttpRequest').mockImplementation(() => mockXHR as unknown as XMLHttpRequest)

    render(<ImageUpload {...DEFAULT_PROPS} />)
    const input = screen.getByLabelText(/Bild auswählen/i)
    const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(DEFAULT_PROPS.onUploaded).toHaveBeenCalledWith('/media/img.jpg', '/media/thumb.jpg')
    })
  })

  it('shows error message when upload fails with 422', async () => {
    const mockXHR = createMockXHR(
      422,
      JSON.stringify({ detail: 'Nur Bildformate erlaubt' }),
    )
    vi.spyOn(window, 'XMLHttpRequest').mockImplementation(() => mockXHR as unknown as XMLHttpRequest)

    render(<ImageUpload {...DEFAULT_PROPS} />)
    const input = screen.getByLabelText(/Bild auswählen/i)
    fireEvent.change(input, { target: { files: [new File(['x'], 'a.exe')] } })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Nur Bildformate erlaubt')
    })
  })

  it('shows error message when upload fails with 413 (too large)', async () => {
    const mockXHR = createMockXHR(413, JSON.stringify({ detail: 'Datei zu groß. Maximum: 20MB' }))
    vi.spyOn(window, 'XMLHttpRequest').mockImplementation(() => mockXHR as unknown as XMLHttpRequest)

    render(<ImageUpload {...DEFAULT_PROPS} />)
    const input = screen.getByLabelText(/Bild auswählen/i)
    fireEvent.change(input, { target: { files: [new File(['x'], 'big.jpg')] } })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('shows replace button after image is present', () => {
    render(<ImageUpload {...DEFAULT_PROPS} currentImageUrl="/media/test.jpg" />)
    expect(screen.getByText(/Bild ersetzen/i)).toBeInTheDocument()
  })

  it('shows progress bar during upload', async () => {
    const mockXHR = createMockXHR(
      201,
      JSON.stringify({ image_path: '/media/img.jpg', thumbnail_path: '/media/thumb.jpg' }),
      true, // trigger progress events
    )
    vi.spyOn(window, 'XMLHttpRequest').mockImplementation(() => mockXHR as unknown as XMLHttpRequest)

    render(<ImageUpload {...DEFAULT_PROPS} />)
    const input = screen.getByLabelText(/Bild auswählen/i)
    fireEvent.change(input, { target: { files: [new File(['x'], 'photo.jpg')] } })

    // Progress bar should appear
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })
})
