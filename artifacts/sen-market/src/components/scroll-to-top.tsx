import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 350);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Retour en haut"
      className="fixed bottom-20 right-4 z-50 w-11 h-11 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all md:bottom-6 md:right-6 border border-white/20"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}
