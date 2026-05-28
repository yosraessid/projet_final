import { useEffect } from 'react'

/**
 * Ferme un menu quand on clique en dehors de l'element reference.
 */
export function useClickOutside(ref, onClose, isActive = true) {
  useEffect(() => {
    if (!isActive) return undefined

    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [ref, onClose, isActive])
}
