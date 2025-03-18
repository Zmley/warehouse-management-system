import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/auth'
import { loginUser, fetchUserProfile } from '../api/authApi'
import { clearTokens, saveTokens, areTokensValid } from '../utils/Storages'

export const useAuth = () => {
  const { setUserProfile } = useContext(AuthContext)!
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    areTokensValid()
  )
  const navigate = useNavigate()

  const handleLogin = async (email: string, password: string) => {
    setError(null)
    try {
      const tokens = await loginUser(email, password)
      saveTokens(tokens)

      const userData = await fetchUserProfile()
      setUserProfile({
        firstname: userData.firstName,
        lastname: userData.lastName,
        email: userData.email,
        role: userData.role
      })

      setIsAuthenticated(true)
      console.log('✅ Login successful! Redirecting to dashboard...')
      navigate('/dashboard')
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
    setUserProfile(null)
    setIsAuthenticated(false)
    navigate('/')
  }

  return { handleLogin, handleLogout, isAuthenticated, error }
}
