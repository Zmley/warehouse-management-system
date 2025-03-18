import React, { createContext, useState, useEffect } from 'react';
import { fetchUserProfile } from '../api/authApi';
import { areTokensValid, clearTokens } from '../utils/Storages';

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
  // logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(areTokensValid());

  useEffect(() => {
    if (isAuthenticated && !userProfile) {
      console.log('🔄 Fetching user profile...');
      fetchUserProfile()
        .then((userData) => {
          setUserProfile({
            firstname: userData.firstName,
            lastname: userData.lastName,
            email: userData.email,
            role: userData.role
          });
        })
        .catch((error) => {
          console.error('❌ Failed to fetch user profile:', error);
          setIsAuthenticated(false); 
          clearTokens(); 
        });
    }
  }, [isAuthenticated, userProfile]);

  // const logout = () => {
  //   console.log("❌ Logging out...");
  //   clearTokens();
  //   setUserProfile(null);
  //   setIsAuthenticated(false);
  // };

  return (
    <AuthContext.Provider value={{ userProfile, setUserProfile, isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};