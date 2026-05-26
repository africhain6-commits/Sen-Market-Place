import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Zap, MessageCircle, Check } from "lucide-react";

const BOOST_PLANS = [
  { days: 7, label: "7 jours", price: 1000, popular: false },
  { days: 30, label: "30 jours", price: 3000, popular: true },
  { days: 90, label: "3 mois", price: 7500, popular: false },
];

interface BoostModalProps {
  open: boolean;
  onClose: () => void;
  listingTitle: string;
  listingId: number;
}

export function BoostModal({ open, onClose, listingTitle, listingId }: BoostModalProps) {
  const [selected, setSelected] = useState(30);

  const plan = BOOST_PLANS.find((p) => p.days === selected)!;
  const waMsg = encodeURIComponent(
    `Bonjour, je souhaite booster mon annonce "${listingTitle}" (ID: ${listingId}) pour ${plan.days} jours — ${plan.price.toLocaleString("fr-SN")} FCFA. Merci !`
  );
  const waUrl = `https://wa.me/221773579701?text=${waMsg}`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Zap className="w-5 h-5 text-[#D4AF37]" />
            Booster votre annonce
          </DialogTitle>
          <DialogDescription>
            Passez en <strong>VEDETTE</strong> pour apparaître en première position et recevoir jusqu'à 10× plus de vues.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-2">
          {BOOST_PLANS.map((p) => (
            <button
              key={p.days}
              onClick={() => setSelected(p.days)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                selected === p.days
                  ? "border-[#D4AF37] bg-[#D4AF37]/10"
                  : "border-border hover:border-[#D4AF37]/50"
              }`}
            >
              <div className="flex items-center gap-3">
                {selected === p.days ? (
                  <div className="w-5 h-5 rounded-full bg-[#D4AF37] flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/40" />
                )}
                <div className="text-left">
                  <div className="font-semibold">{p.label}</div>
                  {p.popular && (
                    <div className="text-xs text-[#D4AF37] font-medium">⭐ Le plus populaire</div>
                  )}
                </div>
              </div>
              <div className="font-bold text-primary">
                {p.price.toLocaleString("fr-SN")} FCFA
              </div>
            </button>
          ))}
        </div>

        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
          Paiement via <strong>Wave</strong> ou <strong>Orange Money</strong> au <strong>+221 77 357 97 01</strong>. Votre annonce sera boostée dans les 24h après confirmation.
        </div>

        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="block">
          <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white gap-2 text-base font-bold h-12">
            <MessageCircle className="w-5 h-5" />
            Payer via WhatsApp
          </Button>
        </a>
      </DialogContent>
    </Dialog>
  );
}
