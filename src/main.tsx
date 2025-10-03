import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import VehicleDetail from './pages/VehicleDetail'
import UsedCar from './pages/UsedCar'
import Insurance from './pages/Insurance'
import './styles.css'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav className="nav">
        <Link to="/">메인</Link>
        <Link to="/used-car">중고차</Link>
        <Link to="/insurance">보험</Link>
      </nav>
      <div className="container">{children}</div>
    </div>
  )
}

const router = createBrowserRouter([
  { path: '/', element: <Layout><Dashboard /></Layout> },
  { path: '/vehicle/:vehicleId', element: <Layout><VehicleDetail /></Layout> },
  { path: '/used-car', element: <Layout><UsedCar /></Layout> },
  { path: '/insurance', element: <Layout><Insurance /></Layout> }
])

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)


