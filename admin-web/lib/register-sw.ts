/**
 * OneHealth PWA - Service Worker Registration
 */
export async function registerSW() {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      console.log("OneHealth SW registered:", registration.scope);

      // Check for updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // New service worker available
            console.log("OneHealth: New content available, please refresh.");
            // Could show a notification here
          }
        });
      });

      return registration;
    } catch (error) {
      console.error("OneHealth SW registration failed:", error);
    }
  }
}