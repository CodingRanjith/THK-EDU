import { createContext, useCallback, useContext, useState } from 'react'
import { AlertModal } from '@/components/ui/alert-modal'

const AlertContext = createContext(null)

export function AlertProvider({ children }) {
  const [alert, setAlert] = useState(null)

  const showAlert = useCallback(({ type = 'success', title, message, details }) => {
    setAlert({ type, title, message, details })
  }, [])

  const showSuccess = useCallback((title, message, details) => {
    showAlert({ type: 'success', title, message, details })
  }, [showAlert])

  const showError = useCallback((title, message, details) => {
    showAlert({ type: 'error', title, message, details })
  }, [showAlert])

  const showWarning = useCallback((title, message, details) => {
    showAlert({ type: 'warning', title, message, details })
  }, [showAlert])

  const closeAlert = useCallback(() => setAlert(null), [])

  return (
    <AlertContext.Provider value={{ showAlert, showSuccess, showError, showWarning }}>
      {children}
      {alert && (
        <AlertModal
          open
          type={alert.type}
          title={alert.title}
          message={alert.message}
          details={alert.details}
          onClose={closeAlert}
        />
      )}
    </AlertContext.Provider>
  )
}

export function useAlert() {
  const ctx = useContext(AlertContext)
  if (!ctx) throw new Error('useAlert must be used within AlertProvider')
  return ctx
}
