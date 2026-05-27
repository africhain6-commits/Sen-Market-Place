import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PlusCircle, LogOut, Shield, Menu, X, LayoutDashboard, Bell, MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import {
  useGetNotifications,
  useMarkAllNotificationsRead,
  getGetNotificationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

function SenegalFlag({ className = "" }: { className?: string }) {
  return (
    <div className={`flex rounded overflow-hidden shadow-sm border border-white/20 ${className}`}>
      <div className="w-1/3 bg-[#00853F]" />
      <div className="w-1/3 bg-[#FDEF42] flex items-center justify-center">
        <svg viewBox="0 0 20 20" className="w-2.5 h-2.5">
          <polygon
            points="10,2 12.4,7.5 18.5,7.5 13.8,11.5 15.6,17.5 10,13.8 4.4,17.5 6.2,11.5 1.5,7.5 7.6,7.5"
            fill="#00853F"
          />
        </svg>
      </div>
      <div className="w-1/3 bg-[#E31B23]" />
    </div>
  );
}

function NotificationBell({ isAuthenticated }: { isAuthenticated: boolean }) {
  const queryClient = useQueryClient();
  const { data: notifications } = useGetNotifications({
    query: {
      enabled: isAuthenticated,
      queryKey: getGetNotificationsQueryKey(),
      refetchInterval: 30000,
    },
  });
  const markAllRead = useMarkAllNotificationsRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
      },
    },
  });

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length ?? 0;
  const latest = notifications?.slice(0, 6) ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-[#D4AF37] text-[#0A2463] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="text-xs text-primary hover:underline"
            >
              Tout marquer lu
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {latest.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Aucune notification
          </div>
        ) : (
          latest.map((n: any) => (
            <div
              key={n.id}
              className={`px-3 py-2.5 border-b last:border-b-0 ${!n.isRead ? "bg-primary/5" : ""}`}
            >
              <p className={`text-sm ${!n.isRead ? "font-medium" : "text-muted-foreground"}`}>
                {n.message}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(n.createdAt), { locale: fr, addSuffix: true })}
              </p>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary shadow-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5" data-testid="link-home">
          <SenegalFlag className="h-7 w-11" />
          <span className="text-xl font-bold text-white tracking-tight">
            Sen<span className="text-[#D4AF37]">Market</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-5">
          <Link href="/" className="text-sm font-medium text-white/85 hover:text-white transition-colors" data-testid="link-accueil">
            Accueil
          </Link>
          <Link href="/annonces" className="text-sm font-medium text-white/85 hover:text-white transition-colors" data-testid="link-annonces">
            Annonces
          </Link>
          <Link href="/boutiques" className="text-sm font-medium text-white/85 hover:text-white transition-colors" data-testid="link-boutiques">
            Boutiques &amp; Couturiers
          </Link>
          <Link href="/carte" className="text-sm font-medium text-white/85 hover:text-white transition-colors flex items-center gap-1" data-testid="link-carte">
            <MapPin className="w-3.5 h-3.5" />
            Carte
          </Link>
          <Link href="/publicite" className="text-sm font-medium text-white/85 hover:text-white transition-colors" data-testid="link-pub">
            Publicité
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link href="/publier" data-testid="link-publish">
            <Button size="sm" className="hidden sm:flex gap-2 font-semibold bg-[#D4AF37] text-[#0A2463] hover:bg-[#c9a430] border-0">
              <PlusCircle className="h-4 w-4" />
              Publier
            </Button>
            <Button size="icon" className="sm:hidden bg-[#D4AF37] text-[#0A2463] hover:bg-[#c9a430] border-0">
              <PlusCircle className="h-4 w-4" />
            </Button>
          </Link>

          {isAuthenticated && user?.isAdmin && (
            <Link href="/admin">
              <Button size="sm" variant="outline" className="hidden sm:flex gap-2 border-red-400 text-red-400 hover:bg-red-400/10 hover:text-red-300 font-semibold">
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            </Link>
          )}

          {isAuthenticated && (
            <NotificationBell isAuthenticated={isAuthenticated} />
          )}

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full border border-white/20" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl || ""} alt={user.name} />
                    <AvatarFallback className="bg-primary-foreground text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/tableau-de-bord" className="w-full cursor-pointer" data-testid="menu-dashboard">
                    Tableau de bord
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/profil/${user.id}`} className="w-full cursor-pointer" data-testid="menu-profile">
                    Mon profil
                  </Link>
                </DropdownMenuItem>
                {user.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="w-full cursor-pointer text-primary font-semibold" data-testid="menu-admin">
                      <Shield className="mr-2 h-4 w-4" />
                      Administration
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={() => logout()}
                  data-testid="menu-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/connexion" data-testid="link-login">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white hidden sm:flex">
                Connexion
              </Button>
            </Link>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-white/10"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-primary border-t border-white/10 px-4 py-3 flex flex-col gap-2">
          <Link href="/" className="text-sm font-medium text-white/85 hover:text-white py-2 border-b border-white/10" onClick={() => setMobileOpen(false)}>
            Accueil
          </Link>
          <Link href="/annonces" className="text-sm font-medium text-white/85 hover:text-white py-2 border-b border-white/10" onClick={() => setMobileOpen(false)}>
            Toutes les annonces
          </Link>
          <Link href="/boutiques" className="text-sm font-medium text-white/85 hover:text-white py-2 border-b border-white/10" onClick={() => setMobileOpen(false)}>
            Boutiques &amp; Couturiers
          </Link>
          <Link href="/carte" className="text-sm font-medium text-white/85 hover:text-white py-2 border-b border-white/10 flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <MapPin className="w-4 h-4" />
            Carte des annonces
          </Link>
          <Link href="/publicite" className="text-sm font-medium text-white/85 hover:text-white py-2 border-b border-white/10" onClick={() => setMobileOpen(false)}>
            Publicité
          </Link>
          {isAuthenticated && user && (
            <>
              <Link href="/tableau-de-bord" className="text-sm font-medium text-white/85 hover:text-white py-2 border-b border-white/10 flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                <LayoutDashboard className="w-4 h-4" />
                Tableau de bord
              </Link>
              <Link href={`/profil/${user.id}`} className="text-sm font-medium text-white/85 hover:text-white py-2 border-b border-white/10 flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                Mon profil
              </Link>
            </>
          )}
          {isAuthenticated && user?.isAdmin && (
            <Link href="/admin" className="text-sm font-bold text-red-400 hover:text-red-300 py-2 border-b border-white/10 flex items-center gap-2" onClick={() => setMobileOpen(false)}>
              <Shield className="w-4 h-4" />
              Administration
            </Link>
          )}
          {isAuthenticated && user && (
            <button
              onClick={() => { logout(); setMobileOpen(false); }}
              className="text-sm font-medium text-white/60 hover:text-white py-2 text-left border-b border-white/10"
            >
              Déconnexion
            </button>
          )}
          {!isAuthenticated && (
            <Link href="/connexion" className="text-sm font-medium text-white/85 hover:text-white py-2" onClick={() => setMobileOpen(false)}>
              Connexion
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
