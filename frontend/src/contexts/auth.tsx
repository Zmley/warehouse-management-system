import React, { createContext, useState, useEffect } from 'react';
import { fetchUserProfile } from '../api/authApi';
import { areTokensValid } from '../utils/Storages';

interface UserProfile {
  firstname: string;
  lastname: string;
  email: string;
  role: string;
}

interface AuthContextType {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const isAuthenticated = areTokensValid();

  useEffect(() => {
    if (isAuthenticated && !userProfile) {
      console.log('🔄 Fetching user profile...');
      fetchUserProfile()
        .then((userData) => {
          setUserProfile({
            firstname: userData.firstName,
            lastname: userData.lastName,
            email: userData.email,
            role: userData.role,
          });
        })
        .catch((error) => {
          console.error('❌ Failed to fetch user profile:', error);
        });
    }
  }, [isAuthenticated, userProfile]);

  return (
    <AuthContext.Provider value={{ userProfile, setUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};