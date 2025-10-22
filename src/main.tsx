import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import VehicleDetail from './pages/VehicleDetail'
import VehicleScore from './pages/VehicleScore'
import VehicleHabitMonthly from './pages/VehicleHabitMonthly'
import './styles.css'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav className="nav">
        <Link to="/">메인</Link>
      </nav>
      <div className="container">{children}</div>
    </div>
  )
}

const router = createBrowserRouter([
  { path: '/', element: <Layout><Dashboard /></Layout> },
  { path: '/vehicle/:vehicleId', element: <Layout><VehicleDetail /></Layout> },
  { path: '/vehicle/:vehicleId/score', element: <Layout><VehicleScore /></Layout> },
  { path: '/vehicle/:vehicleId/habitmonthly', element: <Layout><VehicleHabitMonthly /></Layout> },
  { 
    path: '*', 
    element: (
      <Layout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>404 - 페이지를 찾을 수 없습니다</h1>
          <p><Link to="/">홈으로 돌아가기</Link></p>
        </div>
      </Layout>
    ) 
  },
])

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
