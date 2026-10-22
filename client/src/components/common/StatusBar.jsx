import React, { useState, useEffect } from 'react';
import { Wifi, Battery } from 'lucide-react';

export default function StatusBar({ theme = 'light' }) {
  const [time, setTime] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`mobile-status-bar ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}>
      <span className="status-time">{time}</span>
      <div className="status-icons">
        <Wifi size={14} />
        <Battery size={16} />
      </div>
    </div>
  );
}
