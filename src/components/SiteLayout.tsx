import { Link } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { Menu, X, Facebook, Instagram, Youtube, Mail, MapPin, Phone, ChevronDown, User } from "lucide-react";
const logoUrl = "/assets/amoi-logo.png";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "../hooks/useAuth";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";


const NAV = [
  { to: "/", label: "Início" },
  { to: "/sobre", label: "Sobre" },
  { to: "/boas-novas", label: "Boas Novas" },
  { to: "/cultos", label: "Cultos" },
];

export function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const [footerConfig, setFooterConfig] = useState({
    address: "Bairro Mandume B, Quarteirão 3, Rua Projectada, Zango 1, Paragem da Praça, Entrada dos Motoqueiros, Bengo, Angola (XCX3+WH9)",
    phone: "+244 930 565 382",
    email: "secretaria.amoi@ministerioamoi.it.ao",
    facebook: "https://facebook.com/ministerioamoi",
    instagram: "https://instagram.com/ministerioamoi",
    youtube: "https://youtube.com/@ministerioamoi",
    tiktok: "https://tiktok.com/@ministerioamoi",
  });

  useEffect(() => {
    // Clear old accumulated browser cache keys
    const cacheKeys = [
      "amoi_carousel_slides",
      "amoi_announcements",
      "amoi_church_info",
      "amoi_servants",
      "amoi_scales",
      "amoi_repertoire",
      "amoi_mock_videos_db"
    ];
    cacheKeys.forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });

    if (!db) return;
    const fetchFooter = async () => {
      try {
        const docRef = doc(db!, "siteConfig", "footer");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFooterConfig((prev) => ({
            ...prev,
            address: data.address || prev.address,
            phone: data.phone || prev.phone,
            email: data.email || prev.email,
            facebook: data.facebook ?? prev.facebook,
            instagram: data.instagram ?? prev.instagram,
            youtube: data.youtube ?? prev.youtube,
            tiktok: data.tiktok ?? prev.tiktok,
          }));
        }
      } catch (err) {
        console.error("Error fetching footer configuration:", err);
      }
    };
    fetchFooter();
  }, []);

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

            {/* Dropdown for smaller desktop/tablet screens (md to xl) */}
            <div 
              className="relative hidden md:block xl:hidden"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 cursor-pointer select-none">
                Serviços <ChevronDown className="h-3.5 w-3.5" />
              </button>
              
              {dropdownOpen && (
                <div className="absolute left-0 mt-1 w-48 rounded-2xl bg-card border border-border/80 shadow-elevated p-2.5 space-y-1 backdrop-blur-xl bg-card/95 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <Link
                    to="/o-chamado"
                    className="block px-3.5 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                    onClick={() => setDropdownOpen(false)}
                  >
                    O Chamado
                  </Link>
                  {user && (user.role === "Servo de Deus" || user.role === "Secretaria" || user.role === "Bravo") && (
                    <Link
                      to="/escalas"
                      className="block px-3.5 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Escalas
                    </Link>
                  )}
                  {user && (
                    <Link
                      to="/repertorio"
                      className="block px-3.5 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Repertório
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Inline links for larger desktop screens (xl and above) */}
            <div className="hidden xl:flex items-center gap-1">
              <Link
                to="/o-chamado"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative"
                activeProps={{ className: "px-4 py-2 text-sm font-semibold text-primary relative" }}
              >
                O Chamado
              </Link>
              {user && (user.role === "Servo de Deus" || user.role === "Secretaria" || user.role === "Bravo") && (
                <Link
                  to="/escalas"
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative"
                  activeProps={{ className: "px-4 py-2 text-sm font-semibold text-primary relative" }}
                >
                  Escalas
                </Link>
              )}
              {user && (
                <Link
                  to="/repertorio"
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative"
                  activeProps={{ className: "px-4 py-2 text-sm font-semibold text-primary relative" }}
                >
                  Repertório
                </Link>
              )}
            </div>
          </nav>

          <div className="hidden md:flex items-center gap-2.5">
            <ThemeToggle />
            {user ? (
              <div 
                className="relative"
                onMouseEnter={() => setProfileDropdownOpen(true)}
                onMouseLeave={() => setProfileDropdownOpen(false)}
              >
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/80 bg-card/60 hover:bg-muted text-foreground transition-colors cursor-pointer select-none text-xs font-semibold">
                  <div className="h-6 w-6 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 text-primary">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <span className="max-w-[100px] truncate">
                    Olá, {user.displayName?.split(" ")[0] || user.email?.split("@")[0]}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 rounded-2xl bg-card border border-border/80 shadow-elevated p-2.5 space-y-1 backdrop-blur-xl bg-card/95 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3.5 py-2 border-b border-border/40 mb-1.5">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Membro AMOI</p>
                      <p className="text-xs font-bold text-foreground truncate mt-0.5" title={user.displayName || user.email || ""}>
                        {user.displayName || user.email}
                      </p>
                    </div>

                    {user.role?.toLowerCase() !== "membro" && user.role !== "Bravo" && user.role !== "Banda" && (
                      <Link
                        to="/admin"
                        className="block px-3.5 py-2 rounded-xl text-xs font-bold text-primary hover:bg-primary/5 transition-all"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Painel de Controle
                      </Link>
                    )}
                    <Link
                      to="/perfil"
                      className="block px-3.5 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      Meu Perfil
                    </Link>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left block px-3.5 py-2 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
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
              <Link
                to="/o-chamado"
                onClick={() => setOpen(false)}
                className="px-3 py-3 rounded-md text-sm font-medium hover:bg-muted"
              >
                O Chamado
              </Link>
              {user && (user.role === "Servo de Deus" || user.role === "Secretaria" || user.role === "Bravo") && (
                <Link
                  to="/escalas"
                  onClick={() => setOpen(false)}
                  className="px-3 py-3 rounded-md text-sm font-semibold text-primary hover:bg-muted"
                >
                  Escalas
                </Link>
              )}
              {user && (
                <Link
                  to="/repertorio"
                  onClick={() => setOpen(false)}
                  className="px-3 py-3 rounded-md text-sm font-semibold text-primary hover:bg-muted"
                >
                  Repertório
                </Link>
              )}
              <div className="flex flex-col gap-2 pt-3 border-t border-border/60 mt-2">
                {user ? (
                  <>
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-xs text-muted-foreground truncate">
                        Olá, {user.displayName || user.email}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {user.role?.toLowerCase() !== "membro" && user.role !== "Bravo" && user.role !== "Banda" && (
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
                { href: footerConfig.facebook, Icon: Facebook },
                { href: footerConfig.instagram, Icon: Instagram },
                { href: footerConfig.youtube, Icon: Youtube },
              ].map(({ href, Icon }, index) => href ? (
                <a
                  key={index}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ) : null)}
              {footerConfig.tiktok && (
                <a
                  href={footerConfig.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all text-xs font-bold"
                >
                  TT
                </a>
              )}
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
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" /> {footerConfig.address}</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary shrink-0" /> {footerConfig.phone}</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary shrink-0" /> {footerConfig.email}</li>
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
