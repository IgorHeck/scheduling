import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Controla o fechamento de um modal:
 * - ESC sempre fecha.
 * - Clicar fora (no overlay) só fecha se o modal NÃO estiver "sujo" (dirty = sem dados preenchidos).
 *   Quando há dados preenchidos, dispara uma balançada sutil indicando que não pode fechar assim.
 *
 * Uso:
 *   const { shaking, onOverlayClick } = useModalDismiss(dirty, onClose)
 *   <div className="modal-overlay" onClick={onOverlayClick}>
 *     <div className={`modal${shaking ? ' modal-shake' : ''}`}> ... </div>
 *   </div>
 */
export function useModalDismiss(dirty: boolean, onClose: () => void) {
  const [shaking, setShaking] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // ESC sempre fecha
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => () => clearTimeout(timer.current), [])

  const onOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      // só reage a clique no próprio overlay, não no conteúdo
      if (e.target !== e.currentTarget) return
      if (!dirty) {
        onClose()
        return
      }
      setShaking(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setShaking(false), 400)
    },
    [dirty, onClose]
  )

  return { shaking, onOverlayClick }
}
