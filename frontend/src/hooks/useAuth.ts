import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from 'contexts/auth'
import { changeWarehouse, loginUser } from 'api/auth'
import { saveTokens, clearTokens } from 'utils/Storages'

export const useAuth = () => {
  const { isAuthenticated, setIsAuthenticated, userProfile } =
    useContext(AuthContext)!
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleLogin = async (email: string, password: string) => {
    setError(null)
    try {
      const res = await loginUser({ email, password })
      saveTokens(res.data)
      setIsAuthenticated(true)

      navigate('/')
    } catch (err: any) {
      console.error(
        '❌ Login Error:',
        err.response?.data?.message || 'Unknown error'
      )
      setError(
        err.response?.data?.message || '❌ Login failed due to unknown error.'
      )
    }
  }

  const handleLogout = () => {
    clearTokens()
    navigate('/')

    setIsAuthenticated(false)
  }

  const changeUserWarehouse = async (warehouseID: string) => {
    if (!warehouseID) return
    setError(null)
    try {
      await changeWarehouse(warehouseID)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to change warehouse')
    } finally {
    }
  }

  return {
    handleLogin,
    handleLogout,
    isAuthenticated,
    error,
    userProfile,
    changeUserWarehouse
  }
}
