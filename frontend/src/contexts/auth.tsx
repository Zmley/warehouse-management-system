import React, { createContext, useState, useEffect } from 'react';
import { areTokensValid, clearTokens } from '../utils/Storages';
import { fetchUserProfile } from '../api/authApi';

interface UserProfile {
  firstname: string;
  lastname: string;
  email: string;
  role: string;
}

interface AuthContextType {
  userProfile: UserProfile | null;  
  setUserProfile: (profile: UserProfile | null) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuth: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); 
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(areTokensValid());

  useEffect(() => {
    if (areTokensValid()) {
      console.log('✅ Token valid, fetching user profile...');
      fetchUserProfile()
        .then(userData => {
          setUserProfile({
            firstname: userData.firstName,
            lastname: userData.lastName,
            email: userData.email,
            role: userData.role
          });
          setIsAuthenticated(true);
        })
        .catch(error => {
          console.error('❌ Failed to fetch user profile:', error);
          clearTokens();
          setUserProfile(null);
          setIsAuthenticated(false);
        });
    } else {
      console.log('❌ No valid token found, logging out.');
      clearTokens();
      setUserProfile(null);
      setIsAuthenticated(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ userProfile, setUserProfile, isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};