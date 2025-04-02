import React, { createContext, useState } from 'react'
import { areTokensValid } from '../utils/Storages'
import { getUserProfile } from '../api/authApi'
import { Task } from '../types/task'

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  role: string
  currentTask?: Task
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
    role: ''
  })
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    areTokensValid()
  )

  const getMe = async () => {
    const account = await getUserProfile()
    setUserProfile(account)
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
