import { useState, useEffect, useCallback } from 'react';

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    // Check if already running as standalone PWA desktop app
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
      setIsInstalled(isStandaloneMode);
    };

    checkStandalone();

    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser's mini-infobar on mobile/desktop
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('[devOrbit PWA] App installed successfully.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Track Service Worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          if (reg.waiting) {
            setHasUpdate(true);
          }

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setHasUpdate(true);
                }
              });
            }
          });
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return { outcome: 'unavailable' };
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
      return choiceResult;
    } catch (err) {
      console.error('[devOrbit PWA] Install prompt error:', err);
      return { outcome: 'error', error: err };
    }
  }, [deferredPrompt]);

  const reloadPWA = useCallback(async () => {
    setIsReloading(true);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          await reg.update().catch(() => {});
        }
        if ('caches' in window) {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map((key) => caches.delete(key)));
        }
      }
    } catch (err) {
      console.warn('[devOrbit PWA] Cache update error during reload:', err);
    } finally {
      window.location.reload();
    }
  }, []);

  return {
    isInstallable,
    isInstalled,
    isReloading,
    hasUpdate,
    promptInstall,
    reloadPWA,
  };
};
