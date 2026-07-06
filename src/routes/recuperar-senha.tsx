import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "../lib/firebase";
import { sendPasswordResetEmail, confirmPasswordReset } from "firebase/auth";
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

  // Step 1: Send Reset Link via Firebase or generate mock code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    try {
      const emailClean = email.trim().toLowerCase();

      if (isFirebaseActive) {
        // Use Firebase Auth's native password reset email.
        // This sends a secure reset link directly — no server required.
        await sendPasswordResetEmail(auth!, emailClean);
        toast.success("E-mail de recuperação enviado! Verifique a sua caixa de entrada e clique no link para redefinir a palavra-passe.");
        setStep(2);
      } else {
        // Mock Mode: generate a 6-digit code stored locally
        const mockDb = localStorage.getItem("amoi_mock_users_db");
        let userExists = false;
        let userDisplayName = "Membro";

        if (mockDb) {
          const list = JSON.parse(mockDb);
          const found = list.find((u: any) => u.email.toLowerCase() === emailClean);
          if (found) {
            userExists = true;
            userDisplayName = found.name;
          }
        }

        if (!userExists) {
          toast.error("Não encontramos nenhuma conta com este endereço de e-mail.");
          setLoading(false);
          return;
        }

        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

        const mockResets = JSON.parse(localStorage.getItem("amoi_password_resets") || "{}");
        mockResets[emailClean] = { code: generatedCode, expiresAt };
        localStorage.setItem("amoi_password_resets", JSON.stringify(mockResets));

        toast.success(`[Modo Demo] Código de recuperação: ${generatedCode}. Válido por 15 minutos.`);
        console.log(`\nMOCK RESET CODE para ${emailClean}: ${generatedCode}\n`);
        setStep(2);
      }
    } catch (err: any) {
      console.error(err);
      // Firebase throws auth/user-not-found if the email doesn’t exist
      if (err.code === "auth/user-not-found") {
        toast.error("Não encontramos nenhuma conta com este endereço de e-mail.");
      } else {
        toast.error(err.message || "Ocorreu um erro ao solicitar a redefinição.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Validate Code and Update Password (Mock mode only)
  // Firebase mode uses the link clicked from email which redirects here with ?oobCode=...
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!oobCode && !code) || !newPassword) return;
    if (newPassword !== confirmPassword) {
      toast.warning("As palavras-passe não coincidem.");
      return;
    }
    setLoading(true);

    try {
      // Firebase mode with oobCode from email link: confirm reset directly
      if (isFirebaseActive && oobCode) {
        await confirmPasswordReset(auth!, oobCode, newPassword);
        toast.success("Palavra-passe redefinida com sucesso!");
        navigate({ to: "/login" });
        return;
      }

      // Firebase mode without oobCode: guide user to click email link
      if (isFirebaseActive && !oobCode) {
        toast.info("Verifique o seu e-mail e clique no link de redefinição enviado pelo Firebase para concluir o processo.");
        return;
      }

      // Mock mode: verify 6-digit code and update password in localStorage
      const emailClean = email.trim().toLowerCase();
      const mockResets = JSON.parse(localStorage.getItem("amoi_password_resets") || "{}");
      const stored = mockResets[emailClean];

      if (!stored || stored.code !== code || stored.expiresAt < new Date().toISOString()) {
        toast.error("Código de confirmação incorreto ou expirado.");
        setLoading(false);
        return;
      }

      const mockDb = localStorage.getItem("amoi_mock_users_db");
      if (mockDb) {
        const list = JSON.parse(mockDb);
        const idx = list.findIndex((u: any) => u.email.toLowerCase() === emailClean);
        if (idx !== -1) {
          list[idx] = { ...list[idx], password: newPassword };
          localStorage.setItem("amoi_mock_users_db", JSON.stringify(list));

          // Clean up reset code
          delete mockResets[emailClean];
          localStorage.setItem("amoi_password_resets", JSON.stringify(mockResets));

          toast.success("Palavra-passe redefinida com sucesso! Pode iniciar sessão.");
          navigate({ to: "/login" });
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
                : oobCode
                  ? "O link de redefinãão foi detetado. Defina a sua nova palavra-passe abaixo."
                  : isFirebaseActive
                    ? "Verifique a sua caixa de entrada e clique no link enviado pelo Firebase para redefinir a palavra-passe."
                    : "Insira o código de 6 dígitos recebido e defina a nova palavra-passe."}
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
            /* STEP 2 */
            isFirebaseActive && !oobCode ? (
              /* Firebase mode: Email sent confirmation */
              <div className="space-y-5 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-foreground font-semibold mb-1">E-mail de recuperação enviado!</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Enviado para <strong>{email}</strong>.<br />
                    Clique no link do e-mail do Firebase para redefinir a sua palavra-passe.
                    Verifique também a pasta de spam.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="w-full border-primary/40 text-primary hover:bg-primary/10"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Usar outro e-mail
                </Button>
              </div>
            ) : (
              /* oobCode present (Firebase link) OR Mock mode: show password form */
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* Info alert when oobCode present */}
                {oobCode && (
                  <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-[11px] text-muted-foreground leading-relaxed">
                    <ShieldCheck className="h-4 w-4 text-primary inline mr-1 -mt-0.5" />
                    <strong>Link seguro ativo</strong>: Pode definir a sua nova palavra-passe diretamente abaixo.
                  </div>
                )}

                {/* 6-digit code input: only for mock mode */}
                {!isFirebaseActive && !oobCode && (
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
                  <ArrowLeft className="h-3.5 w-3.5" /> Reenviar e-mail
                </button>
              </form>
            )
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
