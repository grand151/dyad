/**
 * Service Worker registration and management for Dyad PWA
 */

interface ServiceWorkerUpdateEvent {
  type: "update-available" | "update-installed" | "update-ready";
  registration?: ServiceWorkerRegistration;
}

type ServiceWorkerUpdateListener = (event: ServiceWorkerUpdateEvent) => void;

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private listeners: ServiceWorkerUpdateListener[] = [];

  /**
   * Register the service worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Worker not supported in this browser");
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      console.log("Service Worker registered:", this.registration.scope);

      // Check for updates
      this.setupUpdateListener();

      // Check for updates every hour
      setInterval(
        () => {
          this.checkForUpdates();
        },
        60 * 60 * 1000
      );

      return this.registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return null;
    }
  }

  /**
   * Set up listener for service worker updates
   */
  private setupUpdateListener() {
    if (!this.registration) return;

    this.registration.addEventListener("updatefound", () => {
      const newWorker = this.registration?.installing;
      if (!newWorker) return;

      this.notifyListeners({
        type: "update-available",
        registration: this.registration || undefined,
      });

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          this.notifyListeners({
            type: "update-installed",
            registration: this.registration || undefined,
          });
        }
      });
    });

    // Listen for controlling service worker changes
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      this.notifyListeners({
        type: "update-ready",
      });
    });
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdates(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
    } catch (error) {
      console.error("Failed to check for updates:", error);
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) return;

    this.registration.waiting.postMessage({ type: "SKIP_WAITING" });
  }

  /**
   * Unregister service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      return await this.registration.unregister();
    } catch (error) {
      console.error("Failed to unregister service worker:", error);
      return false;
    }
  }

  /**
   * Clear all caches
   */
  async clearCaches(): Promise<void> {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      console.log("All caches cleared");
    } catch (error) {
      console.error("Failed to clear caches:", error);
    }
  }

  /**
   * Add listener for service worker updates
   */
  onUpdate(listener: ServiceWorkerUpdateListener): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(event: ServiceWorkerUpdateEvent) {
    this.listeners.forEach((listener) => listener(event));
  }

  /**
   * Get current registration
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }
}

// Singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

/**
 * Initialize service worker for PWA
 */
export async function initializeServiceWorker(): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.log("Service Worker disabled in development mode");
    return;
  }

  const registration = await serviceWorkerManager.register();

  if (registration) {
    console.log("PWA Service Worker initialized");

    // Listen for updates
    serviceWorkerManager.onUpdate((event) => {
      console.log("Service Worker update:", event.type);

      if (event.type === "update-installed") {
        // Notify user about update
        const shouldUpdate = confirm(
          "A new version of Dyad is available. Reload to update?"
        );

        if (shouldUpdate) {
          serviceWorkerManager.skipWaiting();
          window.location.reload();
        }
      }
    });
  }
}
