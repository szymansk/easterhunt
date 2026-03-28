import { useRef, useState } from 'react'
import { ApiError } from '../../services/api'

interface ImageUploadProps {
  gameId: string
  stationId: string
  currentImageUrl?: string | null
  onUploaded: (imagePath: string, thumbnailPath: string) => void
}

interface UploadResult {
  image_path: string
  thumbnail_path: string
}

export default function ImageUpload({
  gameId,
  stationId,
  currentImageUrl,
  onUploaded,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentImageUrl ?? null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setProgress(0)

    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const result = await uploadWithProgress(
        `/api/games/${gameId}/stations/${stationId}/image`,
        formData,
        (pct) => setProgress(pct),
      )
      setProgress(100)
      onUploaded(result.image_path, result.thumbnail_path)
    } catch (err) {
      setPreview(currentImageUrl ?? null)
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Upload fehlgeschlagen')
      }
    } finally {
      setProgress(null)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset so same file can be re-selected
    e.target.value = ''
  }

  function handleReplace() {
    inputRef.current?.click()
  }

  const isUploading = progress !== null

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-label="Bild auswählen"
        onChange={handleChange}
        disabled={isUploading}
      />

      {/* Preview or placeholder */}
      {preview ? (
        <img
          src={preview}
          alt="Stationsbild"
          className="w-full max-w-xs rounded-xl object-cover aspect-video border border-gray-200"
        />
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="w-full max-w-xs aspect-video rounded-xl border-2 border-dashed border-gray-300
                     flex flex-col items-center justify-center gap-2 text-gray-400
                     hover:border-blue-400 hover:text-blue-400 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-3xl">📷</span>
          <span className="text-sm font-medium">Bild auswählen oder Kamera</span>
        </button>
      )}

      {/* Progress bar */}
      {isUploading && (
        <div className="w-full max-w-xs">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-200"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="text-xs text-gray-500 text-center mt-1">
            {progress === 100 ? 'Fertig!' : `${progress}% hochgeladen…`}
          </p>
        </div>
      )}

      {/* Replace button (shown when image exists and not uploading) */}
      {preview && !isUploading && (
        <button
          type="button"
          onClick={handleReplace}
          className="text-sm text-blue-600 underline hover:text-blue-800"
        >
          Bild ersetzen
        </button>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 text-center max-w-xs" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// XHR-based upload to track progress
// ---------------------------------------------------------------------------

function uploadWithProgress(
  url: string,
  formData: FormData,
  onProgress: (pct: number) => void,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as UploadResult)
        } catch {
          reject(new Error('Ungültige Server-Antwort'))
        }
      } else {
        let message = `HTTP ${xhr.status}`
        try {
          const body = JSON.parse(xhr.responseText) as { detail?: string }
          if (body.detail) message = body.detail
        } catch {
          // ignore
        }
        reject(new ApiError(xhr.status, message))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Netzwerkfehler')))
    xhr.addEventListener('abort', () => reject(new Error('Upload abgebrochen')))

    xhr.open('POST', url)
    xhr.send(formData)
  })
}
