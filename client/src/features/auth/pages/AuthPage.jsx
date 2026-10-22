import React from 'react';
import SplashScreen from '../components/SplashScreen';
import LoginForm from '../components/LoginForm';

export default function AuthPage({ currentScreen, onSwitchScreen, onLoginSuccess }) {
  return (
    <div className="flex min-h-full w-full flex-1 flex-col items-center justify-center overflow-y-auto bg-gradient-to-b from-slate-50 to-blue-50 px-4 py-8">
      {currentScreen === 'splash' ? (
        <SplashScreen onGetStarted={() => onSwitchScreen('login')} />
      ) : (
        <LoginForm onLoginSuccess={onLoginSuccess} />
      )}
    </div>
  );
}
