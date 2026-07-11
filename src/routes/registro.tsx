import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
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
  
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [newsletter, setNewsletter] = useState(true);
  
  const navigate = useNavigate();
  const { loginMock } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Caso o Firebase esteja ativo
    if (auth) {
      try {
        // 1. Criar utilizador com email e senha
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // 2. Atualizar perfil com o Nome Completo
        const displayName = `${firstname} ${lastname}`.trim();
        await updateProfile(user, { displayName });
        
        // Determine role based on administrative email presets
        let role = "membro";
        const emailLower = email.toLowerCase();
        if (emailLower === "admin@amoi.org" || emailLower === "admin@ministerioamoi.it.ao") {
          role = "Servo de Deus";
        } else if (emailLower === "editor@amoi.org" || emailLower === "editor@ministerioamoi.it.ao") {
          role = "Editor";
        } else if (emailLower === "secretaria@amoi.org" || emailLower === "secretaria@ministerioamoi.it.ao") {
          role = "Secretaria";
        } else if (emailLower === "bravo@amoi.org" || emailLower === "bravo@ministerioamoi.it.ao") {
          role = "Bravo";
        } else if (emailLower === "banda@amoi.org" || emailLower === "banda@ministerioamoi.it.ao") {
          role = "Banda";
        }

        // 3. Gravar dados adicionais no Firestore (se configurado)
        if (db) {
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            firstname,
            lastname,
            displayName,
            email,
            phone,
            role,
            newsletter,
            createdAt: new Date().toISOString()
          });
        }
        
        toast.success("Conta criada com sucesso! Bem-vindo à AMOI.");
        navigate({ to: "/" });
      } catch (err: any) {
        console.error(err);
        let errorMsg = "Erro ao criar conta. Por favor, tente novamente.";
        if (err.code === "auth/email-already-in-use") {
          errorMsg = "Este email já está em uso por outra conta.";
        } else if (err.code === "auth/weak-password") {
          errorMsg = "A palavra-passe é demasiado fraca.";
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
        
        if (mockDb.some((u: any) => u.email === email)) {
          toast.error("Este email já está registado (Modo Demo).");
          setLoading(false);
          return;
        }
        
        const newMUser = {
          uid: "mock-uid-" + Date.now(),
          email,
          password,
          name: `${firstname} ${lastname}`.trim(),
          role: "membro",
          newsletter,
          phone,
          createdAt: new Date().toISOString()
        };
        
        mockDb.push(newMUser);
        localStorage.setItem("amoi_mock_users_db", JSON.stringify(mockDb));
        
        loginMock(newMUser.email, newMUser.name, "membro", newsletter);
        toast.success("Conta de teste criada com sucesso!");
        navigate({ to: "/" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar conta simulada.");
    } finally {
      setLoading(false);
    }
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
                    <Input 
                      id="firstname" 
                      required 
                      placeholder="Nome" 
                      value={firstname}
                      onChange={(e) => setFirstname(e.target.value)}
                      className="pl-10 bg-background/60 border-border/60" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastname" className="text-xs uppercase tracking-widest text-primary">Sobrenome</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="lastname" 
                      required 
                      placeholder="Sobrenome" 
                      value={lastname}
                      onChange={(e) => setLastname(e.target.value)}
                      className="pl-10 bg-background/60 border-border/60" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-widest text-primary">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    placeholder="exemplo@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background/60 border-border/60" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs uppercase tracking-widest text-primary">Telemóvel</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="9xx xxx xxx" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 bg-background/60 border-border/60" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs uppercase tracking-widest text-primary">Palavra-passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type={show ? "text" : "password"} 
                    required 
                    placeholder="Palavra-passe" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-background/60 border-border/60" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 text-sm text-muted-foreground cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={newsletter} 
                    onChange={(e) => setNewsletter(e.target.checked)} 
                    className="mt-1 accent-primary" 
                  />
                  <span>Desejo receber a Newsletter e comunicações da AMOI via e-mail.</span>
                </label>
                <label className="flex items-start gap-3 text-sm text-muted-foreground cursor-pointer">
                  <input type="checkbox" required className="mt-1 accent-primary" />
                  <span>Aceito os termos da igreja e políticas de privacidade.</span>
                </label>
              </div>

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

      {/* Loading Vignette Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative flex flex-col items-center justify-center p-8 bg-card/60 border border-primary/20 rounded-3xl shadow-elevated max-w-sm w-[90%] text-center">
            <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl" style={{ background: "var(--gradient-radial-gold)" }} />
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/30 animate-spin mb-4">
              <Flame className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <h3 className="font-display text-lg font-bold text-gradient-gold animate-pulse">A criar a sua conta...</h3>
            <p className="text-xs text-muted-foreground mt-2">Por favor aguarde enquanto configuramos os seus dados de membro na AMOI...</p>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}

