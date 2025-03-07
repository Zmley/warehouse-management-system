import React, { createContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchUserProfile, loginUser } from '../api/authApi'
import { clearTokens, saveTokens, areTokensValid } from '../utils/Storages'

interface UserProfile {
  firstname: string;
  lastname: string;
  email: string;
  role: string;
}

interface AuthContextType {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  const isAuthenticated = !!areTokensValid();

  const login = async (email: string, password: string) => {
    try {
      const tokens = await loginUser(email, password);
      saveTokens(tokens); 
  
      const userData = await fetchUserProfile();  
      console.log("✅ Login successful!", userData);
      navigate("/dashboard");
    } catch (error: any) {
      console.error("❌ Login failed:", error.message);
      throw error;
    }
  };

  const logout = useCallback(() => {
    clearTokens();
    setUserProfile(null);
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated && !userProfile) {
      console.log('🔄 Fetching user profile...');
      fetchUserProfile()
        .then((userData) => {
          console.log('✅ Loaded:', userData);
          setUserProfile({
            firstname: userData.user.firstName,
            lastname: userData.user.lastName,
            email: userData.user.email,
            role: userData.user.role,
          });
        })
        .catch(error => {
          console.error('❌ Failed:', error);
          logout();
        });
    }
  }, [isAuthenticated, logout, userProfile]);

  return (
    <AuthContext.Provider value={{ userProfile, setUserProfile, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};