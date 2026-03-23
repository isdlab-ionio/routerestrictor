import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import MapPage from './pages/MapPage'
import RestrictionsPage from './pages/RestrictionsPage'
import RestrictionFormPage from './pages/RestrictionFormPage'
import DashboardPage from './pages/DashboardPage'
import ExportPage from './pages/ExportPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<MapPage />} />
        <Route path="/restrictions" element={<RestrictionsPage />} />
        <Route path="/restrictions/new" element={<RestrictionFormPage />} />
        <Route path="/restrictions/:id/edit" element={<RestrictionFormPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/export" element={<ExportPage />} />
      </Route>
    </Routes>
  )
}

export default App
