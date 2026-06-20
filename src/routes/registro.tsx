import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import logoUrl from "@/assets/amoi-logo.png";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "Registar — AMOI" },
      { name: "description", content: "Cria a tua conta de membro da AMOI." },
    ],
  }),
  component: Registro,
});

function Registro() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.info("Registo ainda não está ligado a um backend. Esta é a interface de demonstração.");
    }, 700);
  };

  return (
    <SiteLayout>
      <section className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{ background: "var(--gradient-radial-gold)" }} />
        <div className="relative w-full max-w-lg mx-auto px-4">
          <div className="bg-card/80 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 md:p-10 shadow-elevated">
            <div className="text-center">
              <img src={logoUrl} alt="AMOI" className="h-20 w-20 mx-auto object-contain drop-shadow-[0_2px_12px_rgba(212,160,23,0.5)]" />
              <h1 className="mt-5 font-display text-3xl font-bold text-gradient-gold">Junta-te aos Guerreiros</h1>
              <p className="mt-2 text-sm text-muted-foreground">Cria a tua conta de membro AMOI</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstname" className="text-xs uppercase tracking-widest text-primary">Nome</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="firstname" required placeholder="Nome" className="pl-10 bg-background/60 border-border/60" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastname" className="text-xs uppercase tracking-widest text-primary">Apelido</Label>
                  <Input id="lastname" required placeholder="Apelido" className="bg-background/60 border-border/60" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-widest text-primary">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" required placeholder="seu@email.com" className="pl-10 bg-background/60 border-border/60" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs uppercase tracking-widest text-primary">Telemóvel</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" type="tel" placeholder="+000 000 000" className="pl-10 bg-background/60 border-border/60" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs uppercase tracking-widest text-primary">Palavra-passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type={show ? "text" : "password"} required minLength={6} placeholder="Mínimo 6 caracteres" className="pl-10 pr-10 bg-background/60 border-border/60" />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-3 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" required className="mt-1 accent-primary" />
                <span>Aceito os termos da igreja e desejo receber comunicações da AMOI.</span>
              </label>

              <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-primary-foreground font-semibold shadow-gold hover:opacity-90">
                {loading ? "A criar conta..." : (<><Flame className="mr-2 h-4 w-4" /> Criar Conta</>)}
              </Button>
            </form>

            <div className="my-6 relative">
              <div className="gold-divider" />
              <span className="absolute inset-0 -top-2 mx-auto w-fit px-3 bg-card text-xs uppercase tracking-widest text-muted-foreground">ou</span>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Já tens conta?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">Entrar</Link>
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            "Vinde a mim, todos os que estais cansados e oprimidos." — Mateus 11:28
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
