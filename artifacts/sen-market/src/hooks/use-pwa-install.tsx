import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PwaInstallContextType {
  canInstall: boolean;
  isInstalled: boolean;
  install: () => Promise<void>;
}

const PwaInstallContext = createContext<PwaInstallContextType>({
  canInstall: false,
  isInstalled: false,
  install: async () => {},
});

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstallEvent(null);
      setIsInstalled(true);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") {
      setInstallEvent(null);
    }
  };

  return (
    <PwaInstallContext.Provider value={{ canInstall: !!installEvent, isInstalled, install }}>
      {children}
    </PwaInstallContext.Provider>
  );
}

export function usePwaInstall() {
  return useContext(PwaInstallContext);
}
