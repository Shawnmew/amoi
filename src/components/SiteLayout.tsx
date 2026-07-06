import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X, Facebook, Instagram, Youtube, Mail, MapPin, Phone } from "lucide-react";
import logoUrl from "@/assets/amoi-logo.png";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "../hooks/useAuth";


const NAV = [
  { to: "/", label: "Início" },
  { to: "/sobre", label: "Sobre" },
  { to: "/cultos", label: "Cultos" },
  { to: "/o-chamado", label: "O Chamado" },
];

export function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/75 border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={logoUrl}
              alt="AMOI - Associação Ministério de Oração e Intercessão"
              className="h-12 w-12 object-contain drop-shadow-[0_2px_8px_rgba(212,160,23,0.4)] transition-transform group-hover:scale-105"
            />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="font-display text-lg font-bold tracking-wide text-gradient-gold">AMOI</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Bravos Guerreiros da Fé</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative"
                activeProps={{ className: "px-4 py-2 text-sm font-semibold text-primary relative" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                <span className="text-xs text-muted-foreground mr-2 max-w-[120px] truncate" title={user.displayName || user.email || ""}>
                  Olá, {user.displayName?.split(" ")[0] || user.email}
                </span>
                {user.role?.toLowerCase() !== "membro" && (
                  <Button asChild variant="ghost" size="sm" className="mr-1 text-primary hover:text-primary">
                    <Link to="/admin">Painel</Link>
                  </Button>
                )}
                <Button asChild variant="ghost" size="sm" className="mr-1">
                  <Link to="/perfil">Perfil</Link>
                </Button>
                <Button onClick={logout} variant="ghost" size="sm">
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button asChild size="sm" className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold font-semibold">
                  <Link to="/registro">Registar</Link>
                </Button>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              className="p-2 text-foreground"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>

        {open && (
          <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl">
            <div className="px-4 py-4 flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="px-3 py-3 rounded-md text-sm font-medium hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-3 border-t border-border/60 mt-2">
                {user ? (
                  <>
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-xs text-muted-foreground truncate">
                        Olá, {user.displayName || user.email}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {user.role?.toLowerCase() !== "membro" && (
                        <Button asChild size="sm" variant="ghost" className="flex-1 text-primary hover:text-primary">
                          <Link to="/admin" onClick={() => setOpen(false)}>Painel</Link>
                        </Button>
                      )}
                      <Button asChild size="sm" variant="ghost" className="flex-1">
                        <Link to="/perfil" onClick={() => setOpen(false)}>Perfil</Link>
                      </Button>
                      <Button onClick={() => { logout(); setOpen(false); }} size="sm" variant="outline" className="flex-1">
                        Sair
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Button asChild variant="ghost" size="sm" className="flex-1">
                      <Link to="/login" onClick={() => setOpen(false)}>Entrar</Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1 bg-gradient-gold text-primary-foreground font-semibold">
                      <Link to="/registro" onClick={() => setOpen(false)}>Registar</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/60 mt-20 bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src={logoUrl} alt="AMOI" className="h-14 w-14 object-contain" />
              <div>
                <div className="font-display text-xl text-gradient-gold font-bold">AMOI</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Bravos Guerreiros da Fé</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              Associação Ministério de Oração e Intercessão — uma comunidade ardente de fé, oração e adoração ao Deus Altíssimo.
            </p>
            <div className="flex gap-3 mt-6">
              {[
                { href: "https://facebook.com/ministerioamoi", Icon: Facebook },
                { href: "https://instagram.com/ministerioamoi", Icon: Instagram },
                { href: "https://youtube.com/@ministerioamoi", Icon: Youtube },
              ].map(({ href, Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
              <a
                href="https://tiktok.com/@ministerioamoi"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all text-xs font-bold"
              >
                TT
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm uppercase tracking-widest text-primary mb-4">Navegação</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="hover:text-primary transition-colors">{n.label}</Link>
                </li>
              ))}
              <li><Link to="/login" className="hover:text-primary transition-colors">Área do Membro</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm uppercase tracking-widest text-primary mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" /> Bairro Mandume B, Quarteirão 3, Rua Projectada, Zango 1, Paragem da Praça, Entrada dos Motoqueiros, Bengo, Angola (XCX3+WH9)</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary shrink-0" /> +244 930 565 382</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary shrink-0" /> secretaria.amoi@ministerioamoi.it.ao</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>© {new Date().getFullYear()} AMOI — Associação Ministério de Oração e Intercessão.</span>
            <span className="uppercase tracking-widest">"Bravos Guerreiros da Fé"</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
