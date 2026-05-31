import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, KeyRound, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MotDePasseOublie() {
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devToken, setDevToken] = useState<string | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      if (data.token) setDevToken(data.token);
      setStep("reset");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim() || !newPassword) return;
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setStep("done");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/connexion" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </Link>

        {step === "email" && (
          <Card>
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-[#0A2463]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-6 h-6 text-[#0A2463]" />
              </div>
              <CardTitle className="text-[#0A2463]">Mot de passe oublié</CardTitle>
              <CardDescription>
                Entrez votre adresse email pour recevoir un code de réinitialisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button
                  type="submit"
                  className="w-full bg-[#0A2463] hover:bg-[#0A2463]/90"
                  disabled={loading}
                >
                  {loading ? "Envoi en cours..." : "Envoyer le code"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === "reset" && (
          <Card>
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <CardTitle className="text-[#0A2463]">Nouveau mot de passe</CardTitle>
              <CardDescription>
                Entrez le code reçu par email et choisissez un nouveau mot de passe
              </CardDescription>
            </CardHeader>
            <CardContent>
              {devToken && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700 font-medium mb-1">Code de réinitialisation :</p>
                  <p className="text-sm font-mono text-amber-800 break-all">{devToken}</p>
                </div>
              )}
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token">Code de réinitialisation</Label>
                  <Input
                    id="token"
                    type="text"
                    placeholder="Collez votre code ici"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Minimum 6 caractères"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Répétez le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button
                  type="submit"
                  className="w-full bg-[#0A2463] hover:bg-[#0A2463]/90"
                  disabled={loading}
                >
                  {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === "done" && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-[#0A2463]">Mot de passe modifié !</h2>
              <p className="text-muted-foreground">
                Votre mot de passe a été réinitialisé avec succès.
              </p>
              <Button asChild className="bg-[#0A2463] hover:bg-[#0A2463]/90 mt-2">
                <Link href="/connexion">Se connecter</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
