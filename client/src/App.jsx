import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { AlertProvider } from '@/context/AlertContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AdminOnly } from '@/components/auth/AdminOnly'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { DocumentCenterLayout } from '@/components/layout/DocumentCenterLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardHome } from '@/pages/DashboardHome'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { UsersPage } from '@/pages/UsersPage'
import { GenerateDocumentsPage } from '@/pages/documents/GenerateDocumentsPage'
import { DocumentGeneratorPage } from '@/pages/documents/DocumentGeneratorPage'
import { DocumentManagementPage } from '@/pages/documents/DocumentManagementPage'
import { DocumentViewPage } from '@/pages/documents/DocumentViewPage'
import { ClientsPage } from '@/pages/it/ClientsPage'
import { ProposalsPage } from '@/pages/it/ProposalsPage'
import { ProjectsPage } from '@/pages/it/ProjectsPage'
import { getPlaceholderRoutes } from '@/config/navigation'

const placeholderRoutes = getPlaceholderRoutes()

export default function App() {
  return (
    <BrowserRouter>
      <AlertProvider>
        <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route
                path="/dashboard/users"
                element={
                  <AdminOnly>
                    <UsersPage />
                  </AdminOnly>
                }
              />

              <Route path="/dashboard/documents" element={<DocumentCenterLayout />}>
                <Route index element={<Navigate to="generate" replace />} />
                <Route path="generate" element={<GenerateDocumentsPage />} />
                <Route path="generate/:type" element={<DocumentGeneratorPage />} />
                <Route path="management" element={<DocumentManagementPage />} />
                <Route path="management/:id" element={<DocumentViewPage />} />
              </Route>

              <Route path="/dashboard/it/clients" element={<ClientsPage />} />
              <Route path="/dashboard/it/proposals" element={<ProposalsPage />} />
              <Route path="/dashboard/it/projects" element={<ProjectsPage />} />

              {placeholderRoutes.map((item) => (
                <Route key={item.href} path={item.href} element={<PlaceholderPage />} />
              ))}
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </AuthProvider>
      </AlertProvider>
    </BrowserRouter>
  )
}
