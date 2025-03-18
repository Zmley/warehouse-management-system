import React, { createContext, useState } from 'react';
import { areTokensValid } from '../utils/Storages';

interface UserProfile {
  firstname: string;
  lastname: string;
  email: string;
  role: string;
}

interface AuthContextType {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuth: boolean) => void;
}

export const defaultUserProfile: UserProfile = {
  firstname: 'Guest',
  lastname: '',
  email: '',
  role: 'guest'
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultUserProfile); 
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(areTokensValid());

  return (
    <AuthContext.Provider value={{ userProfile, setUserProfile, isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};