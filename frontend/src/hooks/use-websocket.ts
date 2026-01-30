import { useEffect, useRef, useCallback, useState } from "react";

export interface WebSocketMessage {
  type: string;
  data: any;
}

export function useWebSocket(onMessage?: (message: WebSocketMessage) => void) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(() => {
    if (isConnecting || (ws.current && ws.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setIsConnecting(true);
    
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttempts.current = 0;
        setIsConnected(true);
        setIsConnecting(false);
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage?.(message);
        } catch (error) {
          const sanitizedError = error instanceof Error ? error.message.replace(/[\r\n]/g, ' ') : 'Unknown error';
          console.error('Error parsing WebSocket message:', sanitizedError);
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        
        // Only attempt reconnect if we haven't exceeded max attempts
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(Math.pow(2, reconnectAttempts.current) * 1000, 10000);
          console.log(`WebSocket disconnected. Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.log('WebSocket max reconnection attempts reached');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnecting(false);
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setIsConnecting(false);
    }
  }, [onMessage, isConnecting]);

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  return { sendMessage, isConnected, isConnecting };
}
