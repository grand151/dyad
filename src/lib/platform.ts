/**
 * Platform detection utilities for Dyad
 * Determines if running in Electron desktop app or web browser
 */

export type Platform = "electron" | "web";

/**
 * Check if running in Electron environment
 */
export function isElectron(): boolean {
  // Check if window.electron exists (injected by preload script)
  if (typeof window !== "undefined" && (window as any).electron) {
    return true;
  }

  // Check for Electron user agent
  if (
    typeof navigator !== "undefined" &&
    navigator.userAgent.toLowerCase().includes("electron")
  ) {
    return true;
  }

  return false;
}

/**
 * Check if running in web browser environment
 */
export function isWeb(): boolean {
  return !isElectron();
}

/**
 * Get current platform
 */
export function getPlatform(): Platform {
  return isElectron() ? "electron" : "web";
}

/**
 * Check if service worker is supported (web only)
 */
export function isServiceWorkerSupported(): boolean {
  return "serviceWorker" in navigator;
}

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return "showOpenFilePicker" in window;
}

/**
 * Check if running in standalone PWA mode
 */
export function isPWAInstalled(): boolean {
  if (typeof window === "undefined") return false;

  // Check display-mode
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  // Check for iOS Safari
  const isIOSStandalone =
    (navigator as any).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches;

  return isStandalone || isIOSStandalone;
}

/**
 * Get platform-specific capabilities
 */
export interface PlatformCapabilities {
  platform: Platform;
  fileSystem: "native" | "webapi" | "virtual";
  database: "sqlite" | "indexeddb" | "remote";
  notifications: boolean;
  offline: boolean;
}

export function getPlatformCapabilities(): PlatformCapabilities {
  if (isElectron()) {
    return {
      platform: "electron",
      fileSystem: "native",
      database: "sqlite",
      notifications: true,
      offline: true,
    };
  }

  return {
    platform: "web",
    fileSystem: isFileSystemAccessSupported() ? "webapi" : "virtual",
    database: "indexeddb",
    notifications: "Notification" in window,
    offline: isServiceWorkerSupported(),
  };
}
