import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/authContext'
import { loginUser, fetchUserProfile } from '../api/authApi'
import { saveTokens } from '../utils/Storages'

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
        firstname: userData.firstName,
        lastname: userData.lastName,
        email: userData.email,
        role: userData.role
      })
  
      console.log('✅ Navigating to /dashboard now...')
      navigate('/dashboard')
    } catch (err: any) {
      console.error(
        '❌ Login Error:',
        err.response?.data?.message || 'Unknown error'
      )
      
      const errorMsg = err.response?.data?.message || '❌ Login failed due to unknown error.'
      setError(errorMsg)
  
      throw new Error(errorMsg) // ✅ 确保 `handleLoginClick` 也能捕获错误
    }
  }

  return { handleLogin, logout, isAuthenticated, userProfile, error }
}
