/**
 * Public API for canvas-specific toast notifications.
 */
export interface UseCanvasNotificationsComposable {
  notifyCanvasSaved: () => void
  notifyCanvasSaveFailed: () => void
}

/**
 * Centralizes localized canvas success and error notifications.
 */
export const useCanvasNotifications = (): UseCanvasNotificationsComposable => {
  const { showSuccess, showError } = useToastNotification()

  const notifyCanvasSaved = (): void => {
    showSuccess('ideaWorkspace.canvasPage.success.title', 'ideaWorkspace.canvasPage.success.message')
  }

  const notifyCanvasSaveFailed = (): void => {
    showError('ideaWorkspace.canvasPage.error.title', 'ideaWorkspace.canvasPage.error.message')
  }

  return {
    notifyCanvasSaved,
    notifyCanvasSaveFailed
  }
}
