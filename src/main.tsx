import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import VehicleDetail from './pages/VehicleDetail'

const router = createBrowserRouter([
  { path: '/', element: <Dashboard /> },
  { path: '/vehicle/:vehicleId', element: <VehicleDetail /> }
])

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)


