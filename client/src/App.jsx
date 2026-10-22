import React, { useState, useEffect } from 'react';
import DeviceContainer from './components/layout/DeviceContainer';
import AuthPage from './features/auth/pages/AuthPage';
import MainDashboardPage from './features/dashboard/pages/MainDashboardPage';
import { AuthProvider, useAuth } from './features/auth/context/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

function MainApp() {
  const { user, login, logout, isAuthenticated } = useAuth();
  const [currentScreen, setCurrentScreen] = useState(() => {
    return user ? 'home' : 'login';
  });

  const isUserLoggedIn = isAuthenticated && user;

  useEffect(() => {
    if (!isUserLoggedIn && (currentScreen === 'login' || currentScreen === 'splash')) {
      document.body.style.backgroundColor = '#fbfcfe';
      document.documentElement.style.backgroundColor = '#fbfcfe';
    } else {
      document.body.style.backgroundColor = '#07152b';
      document.documentElement.style.backgroundColor = '#07152b';
    }
  }, [isUserLoggedIn, currentScreen]);

  const handleLoginSuccess = (userData) => {
    const role = userData.role || (userData.email?.includes('admin') || userData.username?.toLowerCase().includes('admin') ? 'Admin' : 'Employee');
    const userObj = {
      id: userData.id || userData._id || Date.now().toString(),
      name: userData.name || userData.username || (role === 'Admin' ? 'Hans' : 'User'),
      email: userData.email || userData.username || '',
      role: role
    };
    login(userObj);
    setCurrentScreen('home');
  };

  const handleLogout = () => {
    logout();
    setCurrentScreen('login');
  };

  return (
    <DeviceContainer screenType={isUserLoggedIn ? 'home' : currentScreen}>
      {isUserLoggedIn ? (
        <MainDashboardPage 
          user={user}
          onLogout={handleLogout}
        />
      ) : (
        <AuthPage 
          currentScreen={currentScreen} 
          onSwitchScreen={setCurrentScreen}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </DeviceContainer>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LanguageProvider>
  );
}
