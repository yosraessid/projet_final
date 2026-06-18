/**
 * useClickOutside.js
 * Hook personnalisé pour détecter un clic en dehors d'un élément DOM.
 *
 * Utilisation typique : fermer un menu déroulant ou un panel lorsque
 * l'utilisateur clique ailleurs sur la page.
 *
 * @param {React.RefObject} ref      - Référence vers l'élément à surveiller.
 * @param {Function}        onClose  - Callback appelé lorsqu'un clic extérieur est détecté.
 * @param {boolean}         isActive - Active ou désactive l'écoute (par défaut : true).
 *                                     Mettre à false quand le menu est fermé pour éviter
 *                                     d'attacher un écouteur inutile.
 */

import { useEffect } from 'react'

export function useClickOutside(ref, onClose, isActive = true) {
  useEffect(() => {
    // Si le hook est désactivé, on ne fait rien et on ne retourne rien à nettoyer.
    if (!isActive) return undefined

    /**
     * Gestionnaire d'événement mousedown.
     * Appelle onClose() si le clic n'est pas à l'intérieur de l'élément référencé.
     */
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose()
      }
    }

    // Attache l'écouteur au document pour capturer tous les clics.
    document.addEventListener('mousedown', handleClickOutside)

    // Nettoyage : supprime l'écouteur quand le composant se démonte ou quand isActive change.
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [ref, onClose, isActive])
}
