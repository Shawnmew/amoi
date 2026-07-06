import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import logoUrl from "@/assets/amoi-logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — AMOI" },
      { name: "description", content: "Acede à tua área de membro da AMOI." },
    ],
  }),
  component: Login,
});

function Login() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { loginMock } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Caso o Firebase esteja ativo
    if (auth) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Bem-vindo de volta à AMOI!");
        navigate({ to: "/" });
      } catch (err: any) {
        console.error(err);
        let errorMsg = "Erro ao entrar. Por favor, verifique as suas credenciais.";
        if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
          errorMsg = "Email ou palavra-passe incorretos.";
        } else if (err.code === "auth/invalid-email") {
          errorMsg = "Formato de email inválido.";
        }
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. Caso o Firebase NÃO esteja configurado (Modo Mock/Local)
    try {
      if (typeof window !== "undefined") {
        const mockDbStr = localStorage.getItem("amoi_mock_users_db");
        const mockDb = mockDbStr ? JSON.parse(mockDbStr) : [];
        const found = mockDb.find((u: any) => u.email === email && u.password === password);
        
        if (found) {
          loginMock(found.email, found.name, found.role || "membro", typeof found.newsletter === "boolean" ? found.newsletter : true);
          toast.success(`Entrou no Modo Demo como ${found.name}!`);
          navigate({ to: "/" });
        } else {
          toast.error("Email ou palavra-passe incorretos (Use: admin@amoi.org / admin).");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao autenticar no modo de demonstração.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <SiteLayout>
      <section className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{ background: "var(--gradient-radial-gold)" }} />
        <div className="relative w-full max-w-md mx-auto px-4">
          <div className="bg-card/80 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 md:p-10 shadow-elevated">
            <div className="text-center">
              <img src={logoUrl} alt="AMOI" className="h-20 w-20 mx-auto object-contain drop-shadow-[0_2px_12px_rgba(212,160,23,0.5)]" />
              <h1 className="mt-5 font-display text-3xl font-bold text-gradient-gold">Bem-vindo de volta</h1>
              <p className="mt-2 text-sm text-muted-foreground">Entra na tua área de membro AMOI</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-widest text-primary">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    placeholder="seu@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background/60 border-border/60" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs uppercase tracking-widest text-primary">Palavra-passe</Label>
                  <Link to="/recuperar-senha" className="text-xs text-muted-foreground hover:text-primary hover:underline">Esqueceu?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type={show ? "text" : "password"} 
                    required 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-background/60 border-border/60" 
                  />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-primary-foreground font-semibold shadow-gold hover:opacity-90">
                {loading ? "A entrar..." : (<><Flame className="mr-2 h-4 w-4" /> Entrar</>)}
              </Button>
            </form>

            <div className="my-6 relative">
              <div className="gold-divider" />
              <span className="absolute inset-0 -top-2 mx-auto w-fit px-3 bg-card text-xs uppercase tracking-widest text-muted-foreground">ou</span>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Ainda não tens conta?{" "}
              <Link to="/registro" className="text-primary font-semibold hover:underline">Cria a tua conta</Link>
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            "Pedi, e dar-se-vos-á; buscai, e encontrareis." — Mateus 7:7
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}

