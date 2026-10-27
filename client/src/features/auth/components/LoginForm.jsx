import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Download } from 'lucide-react';
import logoImg from '../../../assets/images/logo.png';
import { useLanguage } from '../../../contexts/useLanguage';
import apiService from '../../../services/api';

export default function LoginForm({ onLoginSuccess }) {
  const { language, setLanguage, t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanInput = username.trim();
    if (!cleanInput || !password.trim()) {
      setErrorMessage('Please enter your email and password');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Try Backend API login
      const res = await apiService.login(cleanInput, password);
      if (res && res.success && res.user) {
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
        setIsLoading(false);
        return;
      }
      
      // If backend returned explicit error message
      if (res && res.message && !res.offline) {
        setErrorMessage(res.message);
        setIsLoading(false);
        return;
      }

      // 2. Direct Admin Credential Verification Fallback
      if (cleanInput.toLowerCase() === 'hans@task.com') {
        if (password !== '123456') {
          setErrorMessage('Invalid password for hans@task.com');
          setIsLoading(false);
          return;
        }

        if (onLoginSuccess) {
          onLoginSuccess({
            id: 'admin_1',
            name: 'Hans',
            email: 'hans@task.com',
            role: 'Admin'
          });
        }
      } else {
        // Check registered employees in localStorage
        let matchingEmp = null;
        try {
          const savedEmployees = JSON.parse(localStorage.getItem('office_crm_employees') || '[]');
          matchingEmp = savedEmployees.find(e => 
            (e.email && e.email.toLowerCase() === cleanInput.toLowerCase()) ||
            (e.name && e.name.toLowerCase() === cleanInput.toLowerCase())
          );
        } catch (e) {}

        if (matchingEmp) {
          // Verify password if one was set
          if (matchingEmp.password && matchingEmp.password !== password) {
            setErrorMessage(`Incorrect password for ${matchingEmp.name}`);
            setIsLoading(false);
            return;
          }

          if (onLoginSuccess) {
            onLoginSuccess({
              id: matchingEmp.id,
              name: matchingEmp.name,
              email: matchingEmp.email,
              role: matchingEmp.role || 'Employee'
            });
          }
        } else {
          setErrorMessage('Account not found. Only Admin-registered employees can log in.');
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-full w-full flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-6 sm:py-8">
      <div className="my-auto w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
        <div className="mb-4 flex items-center justify-end gap-2">
          <label htmlFor="login-language" className="text-xs font-semibold text-slate-500">{t('Language')}</label>
          <select
            id="login-language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700"
          >
            <option value="en">English</option>
            <option value="gu">ગુજરાતી</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>
        {/* Header with Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-2">
            <img src={logoImg} alt="Office CRM Logo" className="h-full w-full object-contain" />
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-slate-900">Office CRM</h1>
          <p className="mt-1 text-sm text-slate-500">{t('Welcome Back')}</p>
        </div>

        {/* Login Form */}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          
          {/* Email or Username */}
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
            <span className="shrink-0 text-slate-400">
              <User size={20} strokeWidth={1.8} />
            </span>
            <input
              type="text"
              className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              placeholder={t('Email or Username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>

          {/* Password */}
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
            <span className="shrink-0 text-slate-400">
              <Lock size={20} strokeWidth={1.8} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              placeholder={t('Password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="flex shrink-0 items-center justify-center rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? t('Hide password') : t('Show password')}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            className="flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
            disabled={isLoading}
          >
            {isLoading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"></div> : t('Login')}
          </button>

          {/* Error Message */}
          {errorMessage && (
            <div
              className="mt-1 text-center text-sm font-semibold text-red-500"
            >
              {errorMessage}
            </div>
          )}
        </form>

        {/* Download App Option */}
        <div className="mt-5 flex flex-col items-center gap-2 border-t border-slate-100 pt-4 text-center">
          <a
            href="/OfficeCRM.apk"
            download="OfficeCRM.apk"
            className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
          >
            <Download size={14} className="text-emerald-600" />
            <span>{t('Download Android App (.apk)')}</span>
          </a>
          <p className="text-[11px] text-slate-400">
            {t('iPhone users: Tap Share in Safari → "Add to Home Screen"')}
          </p>
        </div>
      </div>
    </div>
  );
}
