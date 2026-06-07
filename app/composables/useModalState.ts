/**
 * Public API for generic modal open/close state.
 */
export interface UseModalStateComposable {
  isOpen: Ref<boolean>
  open: () => void
  close: () => void
}

/**
 * Provides a tiny reusable open/close state for modal-like UI.
 */
export const useModalState = (initialOpen = false): UseModalStateComposable => {
  const isOpen = ref(initialOpen)

  const open = (): void => {
    isOpen.value = true
  }

  const close = (): void => {
    isOpen.value = false
  }

  return {
    isOpen,
    open,
    close
  }
}
