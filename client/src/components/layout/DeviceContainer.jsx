import React from 'react';

export default function DeviceContainer({ children, screenType = 'login' }) {
  return (
    <div className={`relative flex min-h-full w-full flex-1 flex-col overflow-x-hidden overflow-y-auto ${screenType === 'login' || screenType === 'splash' ? 'bg-slate-50' : 'bg-navy'}`}>
      {children}
    </div>
  );
}
