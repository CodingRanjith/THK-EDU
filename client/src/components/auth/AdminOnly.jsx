import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function AdminOnly({ children }) {
  const { user } = useAuth()

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
