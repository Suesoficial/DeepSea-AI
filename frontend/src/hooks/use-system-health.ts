import { useState, useEffect } from 'react';
import { checkApiHealth, type ConnectionState } from '../lib/api';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export function useSystemHealth() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('checking');
  const [systemHealth, setSystemHealth] = useState(100);

  const checkHealth = async () => {
    if (DEMO_MODE) {
      setConnectionState('offline');
      setSystemHealth(95); // Demo mode shows high but not perfect health
      return;
    }

    try {
      const isHealthy = await checkApiHealth();
      setConnectionState(isHealthy ? 'online' : 'offline');
      setSystemHealth(isHealthy ? 100 : 85); // Reduced health when offline
    } catch (error) {
      setConnectionState('error');
      setSystemHealth(60); // Low health on error
    }
  };

  useEffect(() => {
    checkHealth();
    
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  return {
    connectionState,
    systemHealth,
    isOnline: connectionState === 'online',
    isDemoMode: DEMO_MODE,
    isDevMode: DEV_MODE,
    refresh: checkHealth
  };
}