import { useEffect, useRef, useState } from 'react';
import { WebSocketConnection } from '@/lib/websocket';

interface UseWebSocketOptions {
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  autoConnect?: boolean;
}

export function useWebSocket(path: string, options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    autoConnect = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const wsRef = useRef<WebSocketConnection | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    // Create WebSocket connection
    wsRef.current = new WebSocketConnection(path);

    // Set up event handlers
    wsRef.current.onOpen(() => {
      setIsConnected(true);
      setError(null);
      onOpen?.();
    });

    wsRef.current.onClose(() => {
      setIsConnected(false);
      onClose?.();
    });

    wsRef.current.onError((error) => {
      setError(error);
      setIsConnected(false);
      onError?.(error);
    });

    if (onMessage) {
      wsRef.current.onMessage(onMessage);
    }

    // Connect
    wsRef.current.connect().catch((error) => {
      console.error('Failed to connect to WebSocket:', error);
      setError(error);
    });

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, [path, autoConnect]); // Remove callback dependencies to prevent loops

  const sendMessage = (data: any) => {
    if (wsRef.current && wsRef.current.isConnected()) {
      wsRef.current.send(data);
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  const connect = () => {
    if (wsRef.current) {
      wsRef.current.connect().catch((error) => {
        console.error('Failed to connect to WebSocket:', error);
        setError(error);
      });
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.disconnect();
    }
  };

  return {
    isConnected,
    error,
    sendMessage,
    connect,
    disconnect,
  };
}
