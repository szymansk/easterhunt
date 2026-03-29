import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

interface ToastMessage {
  id: number
  text: string
}

interface ToastContextValue {
  showError: (text?: string) => void
}

const ToastContext = createContext<ToastContextValue>({ showError: () => {} })

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const showError = useCallback((text = 'Etwas ist schiefgelaufen. Bitte versuche es erneut.') => {
    const id = ++nextId
    setToasts((prev) => [...prev.slice(-2), { id, text }])
    const timer = setTimeout(() => dismiss(id), 4000)
    timersRef.current.set(id, timer)
  }, [dismiss])

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((t) => clearTimeout(t))
    }
  }, [])

  return (
    <ToastContext.Provider value={{ showError }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none"
        style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            data-testid="toast"
            className="pointer-events-auto bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3 max-w-xs"
          >
            <span className="flex-1">{toast.text}</span>
            <button
              onClick={() => dismiss(toast.id)}
              aria-label="Schließen"
              className="text-gray-400 hover:text-white min-w-[24px] min-h-[24px] flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext)
}
