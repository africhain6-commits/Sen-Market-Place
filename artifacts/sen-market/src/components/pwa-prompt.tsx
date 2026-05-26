import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Bell, BellOff } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowInstall(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") { setNotifGranted(true); return; }
    if (Notification.permission === "denied") return;
    if (localStorage.getItem("notif-asked")) return;
    const t = setTimeout(() => setShowNotif(true), 8000);
    return () => clearTimeout(t);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") {
      setShowInstall(false);
      localStorage.setItem("pwa-install-dismissed", "true");
    }
  };

  const handleDismissInstall = () => {
    setShowInstall(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  const handleEnableNotif = async () => {
    localStorage.setItem("notif-asked", "true");
    setShowNotif(false);
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === "granted") setNotifGranted(true);
  };

  const handleDismissNotif = () => {
    setShowNotif(false);
    localStorage.setItem("notif-asked", "true");
  };

  return (
    <>
      {/* Install Banner */}
      {showInstall && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary text-white shadow-2xl p-4 flex items-center gap-3 md:rounded-t-2xl md:mx-4 md:bottom-4 animate-in slide-in-from-bottom">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center shrink-0 text-[#0A2463] font-bold text-sm">SM</div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Installer SenMarket</p>
            <p className="text-white/75 text-xs">Accès rapide depuis votre écran d'accueil</p>
          </div>
          <Button
            size="sm"
            className="bg-[#D4AF37] text-[#0A2463] hover:bg-[#c9a430] border-0 font-bold shrink-0 gap-1"
            onClick={handleInstall}
          >
            <Download className="w-4 h-4" />
            Installer
          </Button>
          <button onClick={handleDismissInstall} className="text-white/60 hover:text-white shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Notification Banner */}
      {showNotif && !showInstall && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A2463] border-t border-[#D4AF37]/30 text-white shadow-2xl p-4 flex items-center gap-3 md:rounded-t-2xl md:mx-4 md:bottom-4 animate-in slide-in-from-bottom">
          <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Recevoir des notifications</p>
            <p className="text-white/70 text-xs">Soyez alerté des nouvelles annonces qui vous intéressent</p>
          </div>
          <Button
            size="sm"
            className="bg-[#D4AF37] text-[#0A2463] hover:bg-[#c9a430] border-0 font-bold shrink-0"
            onClick={handleEnableNotif}
          >
            Activer
          </Button>
          <button onClick={handleDismissNotif} className="text-white/60 hover:text-white shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  );
}
