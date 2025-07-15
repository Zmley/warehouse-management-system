import { Routes, Route } from 'react-router-dom'
import ScanBin from 'pages/TransportWorker/ScanBin'
import UnloadSuccess from 'pages/Success'
import { useContext, useEffect } from 'react'
import { AuthContext } from 'contexts/auth'
import Dashboard from 'pages/Dashboard'
import PickerScanPage from 'pages/Picker/Scan'
import CreateTaskPage from 'pages/Picker/CreateTask'

import { TransportWorkCartProvider } from 'contexts/cart'
import ScannedProductPage from 'pages/Picker/ScannedProductPage'
import ScanProduct from 'pages/TransportWorker/ScanProduct'

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
            <ScanBin />
          </TransportWorkCartProvider>
        }
      />

      <Route
        path='/my-task/scan-product'
        element={
          <TransportWorkCartProvider>
            <ScanProduct />
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
