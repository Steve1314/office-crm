import React, { useState } from 'react';
import { 
  Wrench, 
  User, 
  Lock, 
  Bell, 
  HelpCircle, 
  Info, 
  ChevronRight,
  X,
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../../../contexts/useLanguage';

export default function ProfilePage({ 
  user = { name: 'Vivek Prajapati', role: 'Employee' }, 
  onLogout 
}) {
  const { language, setLanguage, t } = useLanguage();
  const isAdmin = ['admin', 'manager'].includes(user?.role?.toLowerCase());
  const [activeModal, setActiveModal] = useState(null); // 'info', 'password', 'notifications', 'help', 'about'
  const [lockScreenPush, setLockScreenPush] = useState(true);
  const [headsUpAlerts, setHeadsUpAlerts] = useState(true);

  return (
    <div className="flex min-h-full w-full flex-1 flex-col bg-[#07152b]">
      {/* 1. Header with Tool Icon */}
      <header className="flex w-full shrink-0 items-center gap-3 bg-[#07152b] px-4 pb-4 pt-[max(16px,env(safe-area-inset-top))] text-white sm:px-6 lg:px-9">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10">
          <Wrench size={20} />
        </div>
        <h2 className="text-lg font-bold tracking-tight sm:text-xl">{t('Profile')}</h2>
      </header>

      {/* 2. Curved White Body */}
      <div className="flex min-h-0 w-full flex-1 flex-col self-stretch rounded-t-[24px] bg-white px-3 pb-24 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] sm:rounded-t-[28px] sm:px-6 sm:pt-5 lg:mx-0 lg:max-w-none lg:px-9 lg:pb-9">
        
        {/* User Summary Row */}
        <div className="mb-4 flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
            {user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="truncate text-lg font-bold text-slate-900">{user?.name || 'User'}</h3>
            <span className="w-fit rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{user?.role || 'Employee'}</span>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <label htmlFor="app-language" className="text-sm font-semibold text-slate-800">{t('Language')}</label>
          <select
            id="app-language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="max-w-[60%] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800"
          >
            <option value="en">English</option>
            <option value="gu">ગુજરાતી</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>

        {/* Enclosed Menu Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          
          {/* 1. My Information */}
          <div 
            className="flex w-full cursor-pointer items-center justify-between border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50"
            onClick={() => setActiveModal('info')}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <User size={20} strokeWidth={1.8} />
              </div>
              <span className="truncate text-sm font-semibold text-slate-800">{t('My Information')}</span>
            </div>
            <div className="text-slate-400">
              <ChevronRight size={18} />
            </div>
          </div>

          {/* 2. Change Password */}
          <div 
            className="flex w-full cursor-pointer items-center justify-between border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50"
            onClick={() => setActiveModal('password')}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Lock size={20} strokeWidth={1.8} />
              </div>
              <span className="truncate text-sm font-semibold text-slate-800">{t('Change Password')}</span>
            </div>
            <div className="text-slate-400">
              <ChevronRight size={18} />
            </div>
          </div>

          {/* 3. Notifications (Admin only; completely hidden from employees so employees cannot stop notifications) */}
          {isAdmin && (
            <div 
              className="flex w-full cursor-pointer items-center justify-between border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50"
              onClick={() => setActiveModal('notifications')}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Bell size={20} strokeWidth={1.8} />
                </div>
                <span className="truncate text-sm font-semibold text-slate-800">{t('System Notifications')}</span>
              </div>
              <div className="text-slate-400">
                <ChevronRight size={18} />
              </div>
            </div>
          )}

          {/* 4. Help & Support */}
          <div 
            className="flex w-full cursor-pointer items-center justify-between border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50"
            onClick={() => setActiveModal('help')}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <HelpCircle size={20} strokeWidth={1.8} />
              </div>
              <span className="truncate text-sm font-semibold text-slate-800">{t('Help & Support')}</span>
            </div>
            <div className="text-slate-400">
              <ChevronRight size={18} />
            </div>
          </div>

          {/* 5. About */}
          <div 
            className="flex w-full cursor-pointer items-center justify-between px-4 py-4 text-left transition hover:bg-slate-50"
            onClick={() => setActiveModal('about')}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Info size={20} strokeWidth={1.8} />
              </div>
              <span className="truncate text-sm font-semibold text-slate-800">{t('About')}</span>
            </div>
            <div className="text-slate-400">
              <ChevronRight size={18} />
            </div>
          </div>

        </div>

        {/* Soft Red Logout Button */}
        <div className="mb-9 mt-4">
          <button
            type="button"
            className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
            onClick={onLogout}
          >
            {t('Logout')}
          </button>
        </div>

      </div>

      {/* Interactive Settings Modals */}
      {isAdmin && activeModal === 'notifications' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '380px',
            maxHeight: '90vh',
            maxHeight: '90dvh',
            overflowY: 'auto',
            padding: '20px 18px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f1d38' }}>{t('Push Notifications')}</h3>
              <button 
                type="button" 
                onClick={() => setActiveModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px', lineHeight: 1.4 }}>
              Configured for <strong>Android APK & Web</strong> to deliver high-priority alerts even when your phone is screen-locked.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f1d38' }}>Lock Screen Alerts</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Wake phone when locked</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={lockScreenPush} 
                  onChange={(e) => setLockScreenPush(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: '#1e69ff', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f1d38' }}>Heads-up Banners</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Pop over other running apps</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={headsUpAlerts} 
                  onChange={(e) => setHeadsUpAlerts(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: '#1e69ff', cursor: 'pointer' }}
                />
              </div>
            </div>

            <button
              type="button"
              className="mt-5 min-h-11 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
              style={{ marginTop: '22px' }}
              onClick={() => setActiveModal(null)}
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {activeModal === 'info' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '380px',
            maxHeight: '90vh',
            maxHeight: '90dvh',
            overflowY: 'auto',
            padding: '20px 18px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f1d38' }}>{t('My Information')}</h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#475569' }}>
              <div><strong>Name:</strong> {user?.name || 'User'}</div>
              <div><strong>Role:</strong> {user?.role || 'Employee'}</div>
              <div><strong>Email / ID:</strong> {user?.email || user?.username || 'user@office.crm'}</div>
              <div><strong>Department:</strong> {isAdmin ? 'Administration & Management' : 'Operations & Field Office'}</div>
              <div><strong>Status:</strong> Active</div>
            </div>
            <button
              type="button"
              className="mt-5 min-h-11 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
              style={{ marginTop: '20px' }}
              onClick={() => setActiveModal(null)}
            >
              {t('Close')}
            </button>
          </div>
        </div>
      )}

      {/* About Modal */}
      {activeModal === 'about' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '380px',
            maxHeight: '90vh',
            maxHeight: '90dvh',
            overflowY: 'auto',
            padding: '20px 18px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f1d38' }}>{t('About Office CRM')}</h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.5 }}>
              <p><strong>Office CRM</strong> v1.0.0</p>
              <p style={{ marginTop: '6px' }}>Built for Tasks, Expenses & High-Priority Push Alerts across Web & Android APK.</p>
            </div>
            <button
              type="button"
              className="mt-5 min-h-11 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
              style={{ marginTop: '20px' }}
              onClick={() => setActiveModal(null)}
            >
              {t('Close')}
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {activeModal === 'help' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '380px',
            maxHeight: '90vh',
            maxHeight: '90dvh',
            overflowY: 'auto',
            padding: '20px 18px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f1d38' }}>{t('Help & Support')}</h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.5 }}>
              For support or technical assistance, reach out to your Office CRM Admin or IT Helpdesk.
            </p>
            <button
              type="button"
              className="mt-5 min-h-11 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
              style={{ marginTop: '20px' }}
              onClick={() => setActiveModal(null)}
            >
              {t('Close')}
            </button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {activeModal === 'password' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '380px',
            maxHeight: '90vh',
            maxHeight: '90dvh',
            overflowY: 'auto',
            padding: '20px 18px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f1d38' }}>{t('Change Password')}</h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="password" placeholder={t('Current Password')} className="w-full" />
              <input type="password" placeholder={t('New Password')} className="w-full" />
              <input type="password" placeholder={t('Confirm New Password')} className="w-full" />
            </div>
            <button
              type="button"
              className="mt-5 min-h-11 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
              style={{ marginTop: '18px' }}
              onClick={() => {
                alert('Password updated successfully!');
                setActiveModal(null);
              }}
            >
              {t('Update Password')}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
