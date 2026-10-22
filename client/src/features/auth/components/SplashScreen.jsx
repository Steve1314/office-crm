import React from 'react';
import logoImg from '../../../assets/images/logo.png';
import { useLanguage } from '../../../contexts/useLanguage';

export default function SplashScreen({ onGetStarted }) {
  const { t } = useLanguage();
  return (
    <div
      className="relative flex min-h-dvh w-full cursor-pointer flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950 to-blue-900 px-5 py-12 text-center text-white sm:px-8"
      onClick={onGetStarted}
    >
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative mb-6 flex h-36 w-36 items-center justify-center rounded-full bg-white/10 p-5 shadow-2xl ring-1 ring-white/20 sm:h-44 sm:w-44">
          <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl"></div>
          <img src={logoImg} alt="Office CRM Logo" className="relative h-full w-full object-contain" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Office CRM</h1>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm font-medium text-blue-100 sm:gap-4 sm:text-base">
          <span>{t('Tasks')}</span>
          <span className="h-1 w-1 rounded-full bg-blue-300"></span>
          <span>{t('Expenses')}</span>
          <span className="h-1 w-1 rounded-full bg-blue-300"></span>
          <span>{t('Team')}</span>
        </div>
      </div>

      <div className="relative z-10 pb-2">
        <div className="text-xl font-bold sm:text-2xl">{t('Work Smarter')}</div>
        <div className="mt-1 text-sm text-blue-100 sm:text-base">{t('Stay Organized')}</div>
        </div>

        {/* Bottom Flowing Waves Layered */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 opacity-80 sm:h-44">
          <svg className="h-full w-full" viewBox="0 0 500 150" preserveAspectRatio="none">
            <defs>
              <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0b3b82" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#1a63d9" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0d4194" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#155bd5" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#2478fe" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="waveGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0a2c64" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#124fb8" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <path 
              d="M0,70 C120,120 220,30 360,75 C430,95 480,70 500,60 L500,150 L0,150 Z" 
              fill="url(#waveGrad1)"
            />
            <path 
              d="M0,90 C150,40 280,120 400,60 C460,30 480,50 500,45 L500,150 L0,150 Z" 
              fill="url(#waveGrad3)"
              opacity="0.85"
            />
            <path 
              d="M0,105 C140,80 260,130 380,85 C440,65 480,80 500,75 L500,150 L0,150 Z" 
              fill="url(#waveGrad2)" 
            />
          </svg>
      </div>
    </div>
  );
}
