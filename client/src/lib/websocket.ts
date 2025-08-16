export class WebSocketConnection {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private onMessageCallbacks: ((data: any) => void)[] = [];
  private onOpenCallbacks: (() => void)[] = [];
  private onCloseCallbacks: (() => void)[] = [];
  private onErrorCallbacks: ((error: Event) => void)[] = [];

  constructor(path: string) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    this.url = `${protocol}//${window.location.host}${path}`;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.onOpenCallbacks.forEach(callback => callback());
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.onMessageCallbacks.forEach(callback => callback(data));
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.onCloseCallbacks.forEach(callback => callback());
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.onErrorCallbacks.forEach(callback => callback(error));
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  onMessage(callback: (data: any) => void): void {
    this.onMessageCallbacks.push(callback);
  }

  onOpen(callback: () => void): void {
    this.onOpenCallbacks.push(callback);
  }

  onClose(callback: () => void): void {
    this.onCloseCallbacks.push(callback);
  }

  onError(callback: (error: Event) => void): void {
    this.onErrorCallbacks.push(callback);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
