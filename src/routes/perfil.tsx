import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../hooks/useAuth";
import { auth, db } from "../lib/firebase";
import { updateEmail, updatePassword, updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { User, Mail, Lock, Phone, Bell, Shield, Save, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Minha Conta — AMOI" },
      { name: "description", content: "Gerencie as suas informações de perfil, credenciais e preferências de e-mail na AMOI." },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const { user, loading: authLoading, isMock } = useAuth();
  const navigate = useNavigate();

  // Loading States
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [updatingDetails, setUpdatingDetails] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Form States
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [phone, setPhone] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  
  const [newEmail, setNewEmail] = useState("");
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      toast.warning("Precisa iniciar sessão para ver o seu perfil.");
      navigate({ to: "/login" });
    }
  }, [user, authLoading]);

  // Load profile data
  useEffect(() => {
    if (!user) return;
    
    const loadProfileData = async () => {
      setLoadingProfile(true);
      try {
        if (isMock) {
          // Mock mode load
          const mockDb = localStorage.getItem("amoi_mock_users_db");
          if (mockDb) {
            const list = JSON.parse(mockDb);
            const found = list.find((u: any) => u.email === user.email);
            if (found) {
              const nameParts = found.name.split(" ");
              setFirstname(nameParts[0] || "");
              setLastname(nameParts.slice(1).join(" ") || "");
              setPhone(found.phone || "");
              setNewsletter(!!found.newsletter);
              setNewEmail(found.email || "");
            }
          }
        } else {
          // Firebase mode load
          if (db && auth.currentUser) {
            const uDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
            if (uDoc.exists()) {
              const data = uDoc.data();
              setFirstname(data.firstname || "");
              setLastname(data.lastname || "");
              setPhone(data.phone || "");
              setNewsletter(!!data.newsletter);
              setNewEmail(data.email || auth.currentUser.email || "");
            }
          }
        }
      } catch (err) {
        console.error("Error fetching profile details:", err);
        toast.error("Erro ao carregar dados do perfil.");
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfileData();
  }, [user, isMock]);

  // Handler for Profile Details
  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingDetails(true);

    try {
      const updatedDisplayName = `${firstname} ${lastname}`.trim();

      if (isMock) {
        // Mock update
        const mockDb = localStorage.getItem("amoi_mock_users_db");
        if (mockDb) {
          const list = JSON.parse(mockDb);
          const idx = list.findIndex((u: any) => u.email === user?.email);
          if (idx !== -1) {
            list[idx] = {
              ...list[idx],
              name: updatedDisplayName,
              phone,
              newsletter
            };
            localStorage.setItem("amoi_mock_users_db", JSON.stringify(list));
            
            // Update active session
            const currentSession = localStorage.getItem("amoi_mock_user");
            if (currentSession) {
              const sessionObj = JSON.parse(currentSession);
              localStorage.setItem("amoi_mock_user", JSON.stringify({
                ...sessionObj,
                displayName: updatedDisplayName,
                newsletter
              }));
            }
            toast.success("Perfil atualizado com sucesso!");
            // Reload page to reflect session updates
            window.location.reload();
          }
        }
      } else {
        // Firebase update
        if (db && auth.currentUser) {
          const userDocRef = doc(db, "users", auth.currentUser.uid);
          await updateDoc(userDocRef, {
            firstname,
            lastname,
            displayName: updatedDisplayName,
            phone,
            newsletter
          });

          await updateProfile(auth.currentUser, {
            displayName: updatedDisplayName
          });

          toast.success("Dados atualizados com sucesso!");
          // Reload page to refresh context
          window.location.reload();
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao guardar atualizações.");
    } finally {
      setUpdatingDetails(false);
    }
  };

  // Handler for Changing Email
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || newEmail === user?.email) return;
    setUpdatingEmail(true);

    try {
      if (isMock) {
        // Mock update email
        const mockDb = localStorage.getItem("amoi_mock_users_db");
        if (mockDb) {
          const list = JSON.parse(mockDb);
          const emailExists = list.some((u: any) => u.email === newEmail && u.email !== user?.email);
          if (emailExists) {
            toast.error("Este e-mail já está em uso por outro utilizador.");
            return;
          }

          const idx = list.findIndex((u: any) => u.email === user?.email);
          if (idx !== -1) {
            list[idx] = { ...list[idx], email: newEmail };
            localStorage.setItem("amoi_mock_users_db", JSON.stringify(list));
            
            // Update active session
            const currentSession = localStorage.getItem("amoi_mock_user");
            if (currentSession) {
              const sessionObj = JSON.parse(currentSession);
              localStorage.setItem("amoi_mock_user", JSON.stringify({
                ...sessionObj,
                email: newEmail
              }));
            }
            toast.success("E-mail atualizado com sucesso!");
            window.location.reload();
          }
        }
      } else {
        // Firebase update email
        if (auth.currentUser && db) {
          await updateEmail(auth.currentUser, newEmail);
          
          const userDocRef = doc(db, "users", auth.currentUser.uid);
          await updateDoc(userDocRef, { email: newEmail });
          
          toast.success("E-mail de login atualizado com sucesso!");
          window.location.reload();
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/requires-recent-login") {
        toast.warning("Para alterar o seu e-mail, por razões de segurança, precisa de terminar a sessão e voltar a entrar.");
      } else {
        toast.error(err.message || "Falha ao atualizar o e-mail.");
      }
    } finally {
      setUpdatingEmail(false);
    }
  };

  // Handler for Changing Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    if (newPassword !== confirmPassword) {
      toast.warning("As palavras-passe não coincidem.");
      return;
    }
    setUpdatingPassword(true);

    try {
      if (isMock) {
        // Mock update password
        const mockDb = localStorage.getItem("amoi_mock_users_db");
        if (mockDb) {
          const list = JSON.parse(mockDb);
          const idx = list.findIndex((u: any) => u.email === user?.email);
          if (idx !== -1) {
            list[idx] = { ...list[idx], password: newPassword };
            localStorage.setItem("amoi_mock_users_db", JSON.stringify(list));
            toast.success("Palavra-passe atualizada com sucesso!");
            setNewPassword("");
            setConfirmPassword("");
          }
        }
      } else {
        // Firebase update password
        if (auth.currentUser) {
          await updatePassword(auth.currentUser, newPassword);
          toast.success("Palavra-passe atualizada com sucesso!");
          setNewPassword("");
          setConfirmPassword("");
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/requires-recent-login") {
        toast.warning("Para alterar a sua senha, por razões de segurança, precisa de terminar a sessão e voltar a entrar.");
      } else {
        toast.error(err.message || "Falha ao atualizar a palavra-passe.");
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (authLoading || loadingProfile) {
    return (
      <SiteLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="relative pt-20 pb-16 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: "var(--gradient-radial-gold)" }} />
        
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center md:text-left mb-10">
            <h1 className="text-3xl md:text-4xl font-bold flex items-center justify-center md:justify-start gap-3">
              <User className="h-8 w-8 text-primary" /> Minha Conta
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Gerencie as suas informações de perfil, preferências de e-mail e segurança de login.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: personal profile card */}
            <div className="md:col-span-2 space-y-6">
              <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-elevated">
                <h2 className="text-lg font-bold font-display text-primary flex items-center gap-2 mb-4">
                  <Shield className="h-4 w-4" /> Informações Pessoais
                </h2>
                
                <form onSubmit={handleUpdateDetails} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstname" className="text-xs uppercase tracking-wider text-muted-foreground">Primeiro Nome</Label>
                      <Input
                        id="firstname"
                        required
                        value={firstname}
                        onChange={(e) => setFirstname(e.target.value)}
                        className="bg-background border-border/60"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastname" className="text-xs uppercase tracking-wider text-muted-foreground">Último Nome</Label>
                      <Input
                        id="lastname"
                        required
                        value={lastname}
                        onChange={(e) => setLastname(e.target.value)}
                        className="bg-background border-border/60"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs uppercase tracking-wider text-muted-foreground">Contacto Telefónico</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ex: 9xxxxxxxx"
                        className="pl-10 bg-background border-border/60"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-primary/10 bg-primary/5 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="newsletter"
                      checked={newsletter}
                      onChange={(e) => setNewsletter(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/40 cursor-pointer"
                    />
                    <div className="flex-1">
                      <Label htmlFor="newsletter" className="text-sm font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                        <Bell className="h-3.5 w-3.5 text-primary" /> Subscrever Notificações & Newsletter
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Selecione para receber e-mails automáticos no seu e-mail sempre que a liderança da AMOI publicar uma nova notícia, aviso ou evento no mural.
                      </p>
                    </div>
                  </div>

                  <Button type="submit" disabled={updatingDetails} className="bg-gradient-gold text-primary-foreground font-semibold shadow-gold">
                    {updatingDetails ? "A guardar..." : <><Save className="mr-2 h-4 w-4" /> Guardar Alterações</>}
                  </Button>
                </form>
              </div>

              {/* Status card showing user role */}
              <div className="p-6 rounded-2xl bg-card border border-border/60 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Nível de Permissão</h3>
                  <p className="text-xs text-muted-foreground mt-1">O seu nível de acesso atual nas atividades e gestão do portal.</p>
                </div>
                <span className="px-4 py-1.5 rounded-full bg-primary/20 text-primary font-bold text-xs uppercase tracking-widest border border-primary/30">
                  {user?.role === "Servo de Deus" ? "Servo de Deus (Admin)" : user?.role || "Membro"}
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN: credentials and security */}
            <div className="space-y-6">
              
              {/* Change Email Form */}
              <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-elevated">
                <h2 className="text-lg font-bold font-display text-primary flex items-center gap-2 mb-4">
                  <Mail className="h-4 w-4" /> Alterar E-mail
                </h2>
                
                <form onSubmit={handleUpdateEmail} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">E-mail de Login</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="bg-background border-border/60 text-sm"
                    />
                  </div>
                  
                  <Button type="submit" disabled={updatingEmail || newEmail === user?.email} className="w-full bg-background border border-border text-foreground hover:bg-muted text-xs">
                    {updatingEmail ? "A atualizar..." : "Atualizar E-mail"}
                  </Button>
                </form>
              </div>

              {/* Change Password Form */}
              <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-elevated">
                <h2 className="text-lg font-bold font-display text-primary flex items-center gap-2 mb-4">
                  <Lock className="h-4 w-4" /> Nova Palavra-passe
                </h2>
                
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pass" className="text-xs uppercase tracking-wider text-muted-foreground">Palavra-passe</Label>
                    <div className="relative">
                      <Input
                        id="pass"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Mínimo 6 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-background border-border/60 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conf-pass" className="text-xs uppercase tracking-wider text-muted-foreground">Confirmar Palavra-passe</Label>
                    <Input
                      id="conf-pass"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Repita a palavra-passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-background border-border/60 text-sm"
                    />
                  </div>

                  <Button type="submit" disabled={updatingPassword || !newPassword} className="w-full bg-background border border-border text-foreground hover:bg-muted text-xs">
                    {updatingPassword ? "A atualizar..." : "Alterar Senha"}
                  </Button>
                </form>
              </div>

            </div>

          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
