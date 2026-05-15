import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Registro from './pages/auth/Registro'
import Dashboard from './pages/Dashboard'
import AdminLayout from './layouts/AdminLayout'
import AdminInicio from './pages/admin/Inicio'
import AdminClubes from './pages/admin/Clubes'
import AdminActividades from './pages/admin/Actividades'
import AdminGrupos from './pages/admin/Grupos'
import AdminPersonal from './pages/admin/Personal'
import AdminClubActividad from './pages/admin/ClubActividad'
import AdminSemanas from './pages/admin/Semanas'
import AdminSemanaDetalle from './pages/admin/SemanaDetalle'
import AdminGestion from './pages/admin/Gestion'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/registro" element={<Registro />} />

        <Route path="/dashboard" element={
          <ProtectedRoute rolRequerido="padre">
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute rolRequerido="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminInicio />} />
          <Route path="clubes" element={<AdminClubes />} />
          <Route path="actividades" element={<AdminActividades />} />
          <Route path="grupos" element={<AdminGrupos />} />
          <Route path="personal" element={<AdminPersonal />} />
          <Route path="club-actividad" element={<AdminClubActividad />} />
          <Route path="semanas" element={<AdminSemanas />} />
          <Route path="semanas/:id" element={<AdminSemanaDetalle />} />
          <Route path="gestion" element={<AdminGestion />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
