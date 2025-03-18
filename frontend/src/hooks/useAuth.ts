import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, defaultUserProfile } from '../contexts/auth';  // ✅ 直接从 context 引入
import { loginUser, fetchUserProfile } from '../api/authApi';
import { saveTokens, clearTokens } from '../utils/Storages';

export const useAuth = () => {
  const { setUserProfile, isAuthenticated, setIsAuthenticated } = useContext(AuthContext)!;
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    try {
      const tokens = await loginUser(email, password);
      saveTokens(tokens);
      setIsAuthenticated(true);

      const userData = await fetchUserProfile();
      setUserProfile({
        firstname: userData.firstName,
        lastname: userData.lastName,
        email: userData.email,
        role: userData.role
      });

      console.log('✅ Login successful! Redirecting...');
      navigate('/');
    } catch (err: any) {
      console.error('❌ Login Error:', err.response?.data?.message || 'Unknown error');
      setError(err.response?.data?.message || '❌ Login failed due to unknown error.');
    }
  };

  const handleLogout = () => {
    console.log("❌ Logging out...");
    clearTokens();
    setUserProfile(defaultUserProfile);  
    setIsAuthenticated(false);
    navigate('/');
  };

  return { handleLogin, handleLogout, isAuthenticated, error };
};