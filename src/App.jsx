import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import HouseholdSetup from './pages/HouseholdSetup'
import InventoryPage from './pages/InventoryPage'
import LocationsPage from './pages/LocationsPage'
import ShoppingListPage from './pages/ShoppingListPage'
import ScanReceiptPage from './pages/ScanReceiptPage'
import ReceiptsPage from './pages/ReceiptsPage'
import Layout from './components/Layout'

function AppRoutes() {
  const { user, household, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>
  }

  if (!user) return <AuthPage />
  if (!household) return <HouseholdSetup />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<InventoryPage />} />
        <Route path="/locations" element={<LocationsPage />} />
        <Route path="/shopping" element={<ShoppingListPage />} />
        <Route path="/scan" element={<ScanReceiptPage />} />
        <Route path="/receipts" element={<ReceiptsPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
