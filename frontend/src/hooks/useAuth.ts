import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/authContext'
import { loginUser, fetchUserProfile } from '../api/authApi'
import { saveTokens } from '../utils/storage'

export const useAuth = () => {
  const { logout, isAuthenticated, userProfile, setUserProfile } =
    useContext(AuthContext)!
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleLogin = async (email: string, password: string) => {
    setError(null)
    try {
      const tokens = await loginUser(email, password)
      saveTokens(tokens)
      const userData = await fetchUserProfile()
      setUserProfile({
        firstname: userData.user.firstName,
        lastname: userData.user.lastName,
        email: userData.user.email,
        role: userData.user.role
      })

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

  return { handleLogin, logout, isAuthenticated, userProfile, error }
}
