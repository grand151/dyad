/**
 * IPC Adapter - Abstraction layer for communication between renderer and main process
 * Supports both Electron IPC and Web API calls
 */

import { isElectron } from "../lib/platform";

export type IpcChannel = string;
export type IpcHandler<T = any, R = any> = (data: T) => Promise<R>;

/**
 * IPC Client for sending requests from renderer to main process
 * Automatically chooses between Electron IPC or HTTP API
 */
export class UniversalIpcClient {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = "/api") {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Invoke an IPC method
   */
  async invoke<T = any, R = any>(channel: IpcChannel, data?: T): Promise<R> {
    if (isElectron()) {
      return this.invokeElectron(channel, data);
    } else {
      return this.invokeWeb(channel, data);
    }
  }

  /**
   * Invoke via Electron IPC
   */
  private async invokeElectron<T = any, R = any>(
    channel: IpcChannel,
    data?: T
  ): Promise<R> {
    const electron = (window as any).electron;
    if (!electron || !electron.ipcRenderer) {
      throw new Error("Electron IPC not available");
    }
    return electron.ipcRenderer.invoke(channel, data);
  }

  /**
   * Invoke via Web API
   */
  private async invokeWeb<T = any, R = any>(
    channel: IpcChannel,
    data?: T
  ): Promise<R> {
    const endpoint = `${this.apiBaseUrl}/${channel}`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include", // Include cookies for session
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `API error: ${response.statusText}`
        );
      }

      return response.json();
    } catch (error) {
      console.error(`IPC invoke failed for ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Send message (fire and forget)
   */
  send<T = any>(channel: IpcChannel, data?: T): void {
    if (isElectron()) {
      this.sendElectron(channel, data);
    } else {
      this.sendWeb(channel, data);
    }
  }

  /**
   * Send via Electron IPC
   */
  private sendElectron<T = any>(channel: IpcChannel, data?: T): void {
    const electron = (window as any).electron;
    if (!electron || !electron.ipcRenderer) {
      console.warn("Electron IPC not available");
      return;
    }
    electron.ipcRenderer.send(channel, data);
  }

  /**
   * Send via Web API (fire and forget)
   */
  private sendWeb<T = any>(channel: IpcChannel, data?: T): void {
    const endpoint = `${this.apiBaseUrl}/${channel}`;

    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
      keepalive: true, // Keep connection alive even if page unloads
    }).catch((error) => {
      console.error(`IPC send failed for ${channel}:`, error);
    });
  }

  /**
   * Listen for events from main process
   */
  on<T = any>(
    channel: IpcChannel,
    callback: (event: any, data: T) => void
  ): () => void {
    if (isElectron()) {
      return this.onElectron(channel, callback);
    } else {
      return this.onWeb(channel, callback);
    }
  }

  /**
   * Listen via Electron IPC
   */
  private onElectron<T = any>(
    channel: IpcChannel,
    callback: (event: any, data: T) => void
  ): () => void {
    const electron = (window as any).electron;
    if (!electron || !electron.ipcRenderer) {
      console.warn("Electron IPC not available");
      return () => {};
    }

    electron.ipcRenderer.on(channel, callback);

    return () => {
      electron.ipcRenderer.removeListener(channel, callback);
    };
  }

  /**
   * Listen via WebSocket for web platform
   */
  private onWeb<T = any>(
    channel: IpcChannel,
    callback: (event: any, data: T) => void
  ): () => void {
    // WebSocket connection for real-time events
    const wsUrl = this.getWebSocketUrl(channel);
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(event, data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error for ${channel}:`, error);
    };

    return () => {
      ws.close();
    };
  }

  /**
   * Get WebSocket URL for a channel
   */
  private getWebSocketUrl(channel: IpcChannel): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    return `${protocol}//${host}/ws/${channel}`;
  }
}

// Singleton instance
export const ipcClient = new UniversalIpcClient();
