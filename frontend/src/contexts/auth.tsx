import React, { createContext, useState } from 'react'
import { areTokensValid, clearTokens } from 'utils/Storages'
import { getUserProfile } from 'api/auth'
import { Task } from 'types/task'

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  role: string
  currentTask?: Task
  warehouseID: string
}

interface AuthContextType {
  userProfile: UserProfile
  setUserProfile: (profile: UserProfile) => void
  isAuthenticated: boolean
  setIsAuthenticated: (isAuth: boolean) => void
  getMe: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    warehouseID: ''
  })
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    areTokensValid()
  )

  const getMe = async () => {
    try {
      const account = await getUserProfile()
      setUserProfile(account.data)
    } catch (err: any) {
      clearTokens()
      setIsAuthenticated(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        userProfile,
        setUserProfile,
        isAuthenticated,
        setIsAuthenticated,
        getMe
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
