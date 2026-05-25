import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PlusCircle, User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" data-testid="link-home">
          <span className="text-xl font-bold text-white tracking-tight">
            Sen<span className="text-accent">Market</span>
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/annonces" className="text-sm font-medium text-white/90 hover:text-white hidden sm:block" data-testid="link-annonces">
            Toutes les annonces
          </Link>
          
          <Link href="/publier" data-testid="link-publish">
            <Button size="sm" className="hidden sm:flex gap-2 font-semibold bg-[#D4AF37] text-[#0A2463] hover:bg-[#c9a430] border-0">
              <PlusCircle className="h-4 w-4" />
              Publier
            </Button>
            <Button size="icon" className="sm:hidden bg-[#D4AF37] text-[#0A2463] hover:bg-[#c9a430] border-0">
              <PlusCircle className="h-4 w-4" />
            </Button>
          </Link>

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
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
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
            <div className="flex items-center gap-2">
              <Link href="/connexion" data-testid="link-login">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white hidden sm:flex">
                  Connexion
                </Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
