import React, { useEffect } from 'react';

export const InstallPromptBanner: React.FC = () => {
  useEffect(() => {
    // Intercept and prevent the browser's native install prompt from showing
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Temporarily disabled UI due to compatibility errors on some devices
  return null;
};
