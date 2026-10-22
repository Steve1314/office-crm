import React, { useState } from 'react';
import { backIconButton, screenBody, screenFrame, screenHeader, screenHeaderGroup, screenTitle } from '../../../utils/tailwindClasses';
import { ArrowLeft, User, ChevronDown, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../../contexts/useLanguage';

export default function AddEmployeeScreen({ onBack, onSaveEmployee, employeeToEdit = null }) {
  const { t } = useLanguage();
  const isEditing = Boolean(employeeToEdit);

  const [fullName, setFullName] = useState(employeeToEdit?.name || '');
  const [email, setEmail] = useState(employeeToEdit?.email || '');
  const [password, setPassword] = useState(employeeToEdit?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(employeeToEdit?.role || 'Employee');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const empData = {
      id: employeeToEdit?.id || Date.now().toString(),
      name: fullName.trim(),
      email: email.trim() || `${fullName.toLowerCase().replace(/\s+/g, '.')}@company.com`,
      password: password.trim() || employeeToEdit?.password || 'Vahlay@123',
      role: role,
      status: employeeToEdit?.status || 'Active',
    };

    if (onSaveEmployee) {
      onSaveEmployee(empData);
    }

    setIsSuccess(true);
    setTimeout(() => {
      if (onBack) onBack();
    }, 800);
  };

  return (
    <div className={`${screenFrame} bg-white`}>
      {/* 1. Header with Back Button */}
      <header className={screenHeader}>
        <div className={screenHeaderGroup}>
          <button 
            type="button" 
            className={backIconButton}
            onClick={onBack}
            aria-label="Go Back"
          >
            <ArrowLeft size={22} />
          </button>
          <h2 className={screenTitle}>
            {isEditing ? t('Edit Employee') : t('Add Employee')}
          </h2>
        </div>
      </header>

      {/* 2. Curved White Body */}
      <div className={screenBody} style={{ gap: '22px', paddingBottom: '200px' }}>
        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={36} color="#16a34a" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              {isEditing ? t('Employee Updated!') : t('Account Created!')}
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              {fullName} {isEditing ? t('updated successfully') : `${t('added as')} ${role}`}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
            
            {/* Field 1: Full Name */}
            <div className="flex w-full flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">{t('Full Name')}</label>
              <input 
                type="text"
                className="w-full"
                dir="ltr"
                placeholder={t('Enter full name')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{ height: '52px', borderRadius: '12px' }}
              />
            </div>

            {/* Field 2: Email (Login Username) */}
            <div className="flex w-full flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">{t('Email (Login ID)')}</label>
              <input 
                type="email"
                className="w-full"
                placeholder={t('e.g. employee@company.com')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ height: '52px', borderRadius: '12px' }}
              />
            </div>

            {/* Field 3: Password for Login */}
            <div className="flex w-full flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">
                {t('Password')} {isEditing && <span className="font-normal text-slate-400">({t('Leave blank to keep existing')})</span>}
              </label>
              <div className="relative w-full">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  className="w-full"
                  placeholder={isEditing ? t('Enter new password if changing') : t('Enter login password (min 6 characters)')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!isEditing}
                  style={{ height: '52px', borderRadius: '12px', paddingRight: '46px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={showPassword ? t('Hide password') : t('Show password')}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Field 4: Role */}
            <div className="flex w-full flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">{t('Role')}</label>
              <div className="relative w-full">
                <select
                  className="w-full"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    appearance: 'none',
                    paddingRight: '42px',
                    background: '#ffffff',
                    height: '52px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    color: '#1e293b'
                  }}
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
                <ChevronDown 
                  size={18} 
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#1e293b'
                  }} 
                />
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ marginTop: '12px', marginBottom: '30px' }}>
              <button 
                type="submit" 
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)',
                  transition: 'background-color 0.15s ease, transform 0.1s ease'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {isEditing ? t('Save Changes') : t('Create Account')}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
