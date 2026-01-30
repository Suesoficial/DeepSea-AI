import { useEffect, useState } from 'react';
import { checkApiHealth, type ConnectionState } from '../lib/api';
import { Alert, AlertDescription } from './ui/alert';
import { Info, Wifi, WifiOff, AlertCircle } from 'lucide-react';

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const HEALTH_CHECK_ENABLED = import.meta.env.VITE_HEALTH_CHECK_ENABLED !== 'false';

export function ConnectionStatus() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = async () => {
    if (!HEALTH_CHECK_ENABLED) return;
    
    setConnectionState('checking');
    try {
      const healthy = await checkApiHealth();
      setConnectionState(healthy ? 'online' : 'offline');
      setLastChecked(new Date());
    } catch (error) {
      setConnectionState('error');
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    if (!HEALTH_CHECK_ENABLED) {
      setConnectionState('offline');
      return;
    }

    checkConnection();
    
    // Check every 60 seconds (less aggressive)
    const interval = setInterval(checkConnection, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Don't show anything if health checks are disabled and not in dev mode
  if (!HEALTH_CHECK_ENABLED && !DEV_MODE) {
    return null;
  }

  // Demo mode - show informational banner
  if (DEMO_MODE) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-blue-700">
          Running in demo mode - backend features disabled
        </AlertDescription>
      </Alert>
    );
  }

  // Online state - minimal or hidden
  if (connectionState === 'online') {
    return DEV_MODE ? (
      <Alert className="border-green-200 bg-green-50">
        <Wifi className="h-4 w-4" />
        <AlertDescription className="text-green-700">
          Backend connected
        </AlertDescription>
      </Alert>
    ) : null;
  }

  // Offline state - informational in dev, hidden in prod
  if (connectionState === 'offline') {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <WifiOff className="h-4 w-4" />
        <div className="flex items-center justify-between w-full">
          <AlertDescription className="text-amber-700">
            Analysis services will activate when processing begins
          </AlertDescription>
          {DEV_MODE && (
            <button
              onClick={checkConnection}
              disabled={connectionState === 'checking'}
              className="text-amber-600 hover:text-amber-800 text-sm underline ml-4"
            >
              {connectionState === 'checking' ? 'Checking...' : 'Retry'}
            </button>
          )}
        </div>
      </Alert>
    );
  }

  // Error state - show retry option
  if (connectionState === 'error') {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4" />
        <div className="flex items-center justify-between w-full">
          <AlertDescription className="text-red-700">
            Connection error - please check your network
          </AlertDescription>
          <button
            onClick={checkConnection}
            disabled={connectionState === 'checking'}
            className="text-red-600 hover:text-red-800 text-sm underline ml-4"
          >
            {connectionState === 'checking' ? 'Checking...' : 'Retry'}
          </button>
        </div>
      </Alert>
    );
  }

  // Checking state - minimal loading indicator
  return (
    <Alert className="border-gray-200 bg-gray-50">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
        <AlertDescription className="text-gray-600">
          Checking connection...
        </AlertDescription>
      </div>
    </Alert>
  );
}