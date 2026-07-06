import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, db } from "../lib/firebase";
import { sendPasswordResetEmail, confirmPasswordReset } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { sendResetCodeEmail } from "../lib/email";
import { toast } from "sonner";
import { Mail, Lock, KeyRound, ShieldCheck, ArrowLeft, RefreshCw, Eye, EyeOff } from "lucide-react";
import logoUrl from "@/assets/amoi-logo.png";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar Palavra-passe — AMOI" },
      { name: "description", content: "Recupere o acesso à sua conta de membro do portal AMOI." },
    ],
  }),
  component: RecuperarSenha,
});

function RecuperarSenha() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [oobCode, setOobCode] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get("oobCode");
      if (codeParam) {
        setOobCode(codeParam);
        setStep(2);
        toast.info("Link de redefinição detetado! Defina a sua nova palavra-passe abaixo.");
      }
    }
  }, []);

  // Determine if using Firebase or Mock Mode dynamically
  const isFirebaseActive = !!auth;

  // Step 1: Send Reset Code / Link
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    try {
      const emailClean = email.trim().toLowerCase();
      let userExists = false;
      let userDisplayName = "Membro";

      // 1. Verify if user exists
      if (isFirebaseActive) {
        if (db) {
          // In Firebase, check Firestore if user document exists
          // (Note: Auth email check is safer via signin or firestore check)
          const usersListRef = doc(db, "users_list_lookup", "emails"); // or query users
          // To keep it simple and robust, we check the specific user profile doc:
          // Since uid is doc id, we query the email. If firestore check is restricted,
          // we can proceed directly to sending.
          userExists = true; // Proceed to prevent email enumeration attacks
        } else {
          userExists = true;
        }
      } else {
        // Mock DB check
        const mockDb = localStorage.getItem("amoi_mock_users_db");
        if (mockDb) {
          const list = JSON.parse(mockDb);
          const found = list.find((u: any) => u.email.toLowerCase() === emailClean);
          if (found) {
            userExists = true;
            userDisplayName = found.name;
          }
        }
      }

      if (!userExists) {
        toast.error("Não encontramos nenhuma conta com este endereço de e-mail.");
        setLoading(false);
        return;
      }

      // 2. Generate random 6-digit code
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins validity

      // 3. Save code to store for validation
      if (isFirebaseActive) {
        // Save code to Firestore (overwrites/creates a doc per email)
        if (db) {
          await setDoc(doc(db, "password_resets", emailClean), {
            code: generatedCode,
            email: emailClean,
            expiresAt
          });
        }
        
        // Trigger native Firebase Auth password reset link
        await sendPasswordResetEmail(auth, emailClean);
        toast.info("Enviámos o link oficial de redefinição do Firebase para o seu e-mail.");
      } else {
        // Mock save
        const mockResets = JSON.parse(localStorage.getItem("amoi_password_resets") || "{}");
        mockResets[emailClean] = { code: generatedCode, expiresAt };
        localStorage.setItem("amoi_password_resets", JSON.stringify(mockResets));
      }

      // 4. Send the beautiful custom reset code email via Zoho SMTP
      const emailResult = await sendResetCodeEmail({
        data: {
          email: emailClean,
          code: generatedCode
        }
      });

      if (emailResult.success) {
        if (emailResult.mock) {
          toast.success(`Simulação: Código de recuperação [${generatedCode}] gerado! Verifique a consola do servidor.`);
        } else {
          toast.success("Código de recuperação enviado para o seu e-mail!");
        }
        setStep(2);
      } else {
        toast.error(`Falha ao enviar e-mail: ${emailResult.error}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Ocorreu um erro ao solicitar a redefinição.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Validate Code and Update Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!oobCode && !code) || !newPassword) return;
    if (newPassword !== confirmPassword) {
      toast.warning("As palavras-passe não coincidem.");
      return;
    }
    setLoading(true);

    try {
      const emailClean = email.trim().toLowerCase();

      // If we have a redirect oobCode in Firebase Mode, we confirm the reset directly
      if (isFirebaseActive && oobCode) {
        await confirmPasswordReset(auth, oobCode, newPassword);
        toast.success("Palavra-passe redefinida com sucesso no Firebase!");
        navigate({ to: "/login" });
        return;
      }

      let isValidCode = false;

      // 1. Verify verification code
      if (isFirebaseActive) {
        if (db) {
          const resetDoc = await getDoc(doc(db, "password_resets", emailClean));
          if (resetDoc.exists()) {
            const data = resetDoc.data();
            const now = new Date().toISOString();
            if (data.code === code && data.expiresAt > now) {
              isValidCode = true;
            }
          }
        } else {
          isValidCode = true; // fallback
        }
      } else {
        // Mock verification
        const mockResets = JSON.parse(localStorage.getItem("amoi_password_resets") || "{}");
        const stored = mockResets[emailClean];
        if (stored) {
          const now = new Date().toISOString();
          if (stored.code === code && stored.expiresAt > now) {
            isValidCode = true;
          }
        }
      }

      if (!isValidCode) {
        toast.error("Código de confirmação incorreto ou expirado.");
        setLoading(false);
        return;
      }

      // 2. Perform password update
      if (isFirebaseActive) {
        // Since client side Firebase Auth cannot update a password without being logged in or having an oobCode,
        // we advise the user that the native Firebase reset email link must be clicked.
        toast.success("Código de 6 dígitos validado com sucesso!");
        toast.info("Por razões de segurança do Firebase, conclua a redefinição clicando no link seguro enviado para a sua caixa de entrada.");
        setTimeout(() => {
          navigate({ to: "/login" });
        }, 5000);
      } else {
        // Mock database password update
        const mockDb = localStorage.getItem("amoi_mock_users_db");
        if (mockDb) {
          const list = JSON.parse(mockDb);
          const idx = list.findIndex((u: any) => u.email.toLowerCase() === emailClean);
          if (idx !== -1) {
            list[idx] = { ...list[idx], password: newPassword };
            localStorage.setItem("amoi_mock_users_db", JSON.stringify(list));
            
            // Clean up reset code
            const mockResets = JSON.parse(localStorage.getItem("amoi_password_resets") || "{}");
            delete mockResets[emailClean];
            localStorage.setItem("amoi_password_resets", JSON.stringify(mockResets));

            toast.success("Palavra-passe redefinida com sucesso! Pode iniciar sessão.");
            navigate({ to: "/login" });
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao redefinir a palavra-passe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <section className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-4 py-16 relative">
        {/* Decorative elements */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <div className="relative max-w-md w-full bg-card/60 backdrop-blur-xl border border-border/60 rounded-3xl p-8 sm:p-10 shadow-elevated transition-all">
          
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-4">
              <img src={logoUrl} alt="AMOI" className="h-16 w-16 mx-auto object-contain drop-shadow-gold" />
            </Link>
            <h1 className="font-display text-2xl font-bold">Recuperar Palavra-passe</h1>
            <p className="mt-2 text-xs text-muted-foreground">
              {step === 1 
                ? "Introduza o seu e-mail para receber um código de confirmação."
                : "Insira o código de 6 dígitos enviado e defina a nova palavra-passe."}
            </p>
          </div>

          {step === 1 ? (
            /* STEP 1: Enter email */
            <form onSubmit={handleRequestCode} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">E-mail Registado</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="exemplo@amoi.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background/50 border-border/60"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-primary-foreground font-semibold shadow-gold py-5">
                {loading ? (
                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> A enviar código...</>
                ) : (
                  "Enviar Código de Confirmação"
                )}
              </Button>
            </form>
          ) : (
            /* STEP 2: Verify Code and change password */
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* Info alert in Firebase Mode */}
              {isFirebaseActive && (
                <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-[11px] text-muted-foreground leading-relaxed">
                  <ShieldCheck className="h-4 w-4 text-primary inline mr-1 -mt-0.5" /> 
                  {oobCode ? (
                    <><strong>Link do Firebase Ativo</strong>: Pode definir a sua nova palavra-passe diretamente abaixo para atualizar a sua conta de membro.</>
                  ) : (
                    <><strong>Modo Firebase Ativo</strong>: Enviámos também um e-mail de redefinição oficial do Firebase. Pode utilizar o link oficial no e-mail ou validar o código local abaixo.</>
                  )}
                </div>
              )}

              {!oobCode && (
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-xs uppercase tracking-wider text-muted-foreground">Código de Confirmação (6 Dígitos)</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                    <Input
                      id="code"
                      type="text"
                      required
                      maxLength={6}
                      placeholder="Ex: 123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="pl-10 tracking-[0.25em] font-bold bg-background/50 border-border/60"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="pass" className="text-xs uppercase tracking-wider text-muted-foreground">Nova Palavra-passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    id="pass"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 bg-background/50 border-border/60 text-sm"
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
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    id="conf-pass"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Repita a nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-background/50 border-border/60 text-sm"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-primary-foreground font-semibold shadow-gold py-5">
                {loading ? "A processar..." : "Redefinir Palavra-passe"}
              </Button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground pt-2 flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Reenviar e-mail de código
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-border/60 text-center">
            <Link to="/login" className="text-xs text-primary hover:underline flex items-center justify-center gap-1.5 font-semibold">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o Login
            </Link>
          </div>

        </div>
      </section>
    </SiteLayout>
  );
}
