import { Routes, Route } from 'react-router-dom'
import Scan from 'pages/TransportWorker/Scan'
import UnloadSuccess from 'pages/Success'
import { useContext, useEffect } from 'react'
import { AuthContext } from 'contexts/auth'
import Dashboard from 'pages/Dashboard'
import PickerScanPage from 'pages/Picker/Scan'
import CreateTaskPage from 'pages/Picker/CreateTask'

import { TransportWorkCartProvider } from 'contexts/cart'
import ScannedProductPage from 'pages/Picker/ScannedProductPage'

const PrivateRoutes: React.FC = () => {
  const { getMe } = useContext(AuthContext)!
  useEffect(() => {
    getMe()
  }, [])

  return (
    <Routes>
      <Route path='/' element={<Dashboard />} />
      <Route
        path='/my-task/scan-QRCode'
        element={
          <TransportWorkCartProvider>
            <Scan />
          </TransportWorkCartProvider>
        }
      />

      <Route path='/success' element={<UnloadSuccess />} />

      <Route path='/picker-scan-bin' element={<PickerScanPage />} />
      <Route path='/create-task' element={<CreateTaskPage />} />

      <Route path='/product-info' element={<ScannedProductPage />} />
    </Routes>
  )
}

export default PrivateRoutes
