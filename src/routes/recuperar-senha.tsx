import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, db } from "../lib/firebase";
import { confirmPasswordReset, sendPasswordResetEmail, verifyPasswordResetCode } from "firebase/auth";
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Mail, Lock, KeyRound, ShieldCheck, ArrowLeft, RefreshCw, Eye, EyeOff, CheckCircle2 } from "lucide-react";
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

const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY as string;

// Send OTP email via Brevo
async function sendOtpEmail(toEmail: string, otp: string): Promise<boolean> {
  const htmlContent = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 28px; text-align: center;">
        <h1 style="color: #D4A017; font-size: 26px; margin: 0 0 6px 0; letter-spacing: 3px;">AMOI</h1>
        <p style="color: #9ca3af; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Associação Ministério de Oração e Intercessão</p>
      </div>
      <div style="padding: 32px 28px; text-align: center;">
        <h2 style="color: #111827; font-size: 18px; margin: 0 0 12px 0;">Recuperação de Palavra-passe</h2>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 28px 0;">
          Recebemos um pedido para redefinir a palavra-passe da sua conta AMOI.<br/>
          Utilize o código abaixo para confirmar a sua identidade:
        </p>
        <div style="display: inline-block; padding: 16px 36px; font-size: 36px; font-weight: bold; background: #f9fafb; color: #D4A017; border-radius: 12px; letter-spacing: 8px; border: 2px solid #D4A017; margin-bottom: 24px;">
          ${otp}
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          Este código é válido por <strong>15 minutos</strong>.<br/>
          Se não solicitou esta alteração, ignore este e-mail.
        </p>
      </div>
      <div style="background: #f9fafb; padding: 16px 28px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="color: #9ca3af; font-size: 11px; margin: 0;">Secretaria Geral da AMOI &middot; Luanda, Angola</p>
      </div>
    </div>
  `;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "AMOI", email: "no-reply@ministerioamoi.it.ao" },
        to: [{ email: toEmail }],
        subject: "[AMOI] Código de Recuperação de Palavra-passe",
        htmlContent,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function RecuperarSenha() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Firebase oobCode (from URL link)
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

  // Step 1: Send OTP via Brevo
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    try {
      const emailClean = email.trim().toLowerCase();
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      // Store OTP in Firestore
      if (db) {
        const docKey = emailClean.replace(/[@.]/g, "_");
        await setDoc(doc(db, "passwordResets", docKey), {
          email: emailClean,
          otp,
          expiresAt,
          createdAt: serverTimestamp(),
        });
      } else {
        // Fallback: localStorage (mock mode)
        const resets = JSON.parse(localStorage.getItem("amoi_password_resets") || "{}");
        resets[emailClean] = { otp, expiresAt };
        localStorage.setItem("amoi_password_resets", JSON.stringify(resets));
      }

      // Send OTP via Brevo
      const sent = await sendOtpEmail(emailClean, otp);

      if (sent) {
        toast.success("Código de verificação enviado! Verifique a sua caixa de entrada.");
      } else {
        toast.warning("Código gerado mas e-mail pode não ter chegado. Tente novamente.");
      }

      setStep(2);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao enviar o código de recuperação.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length < 6) return;
    setLoading(true);

    try {
      const emailClean = email.trim().toLowerCase();
      let storedOtp = "";
      let storedExpiry = "";

      if (db) {
        const docKey = emailClean.replace(/[@.]/g, "_");
        const snap = await getDoc(doc(db, "passwordResets", docKey));
        if (snap.exists()) {
          storedOtp = snap.data().otp;
          storedExpiry = snap.data().expiresAt;
        }
      } else {
        const resets = JSON.parse(localStorage.getItem("amoi_password_resets") || "{}");
        if (resets[emailClean]) {
          storedOtp = resets[emailClean].otp;
          storedExpiry = resets[emailClean].expiresAt;
        }
      }

      if (!storedOtp) {
        toast.error("Código não encontrado. Solicite um novo código.");
        return;
      }

      if (new Date().toISOString() > storedExpiry) {
        toast.error("O código expirou. Solicite um novo código.");
        setStep(1);
        return;
      }

      if (code !== storedOtp) {
        toast.error("Código incorreto. Tente novamente.");
        return;
      }

      // OTP valid — move to password reset step
      toast.success("Código verificado! Defina agora a sua nova palavra-passe.");
      setStep(3);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao verificar o código.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password via Firebase or oobCode
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    if (newPassword !== confirmPassword) {
      toast.warning("As palavras-passe não coincidem.");
      return;
    }
    if (newPassword.length < 6) {
      toast.warning("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);

    try {
      if (auth) {
        // Use Firebase's sendPasswordResetEmail to get the reset link
        // OTP was already verified, so we can trust this request
        const emailClean = email.trim().toLowerCase();

        if (oobCode) {
          // Direct reset via Firebase link (oobCode in URL)
          await confirmPasswordReset(auth, oobCode, newPassword);
          toast.success("Palavra-passe redefinida com sucesso!");
        } else {
          // Send Firebase reset email now that OTP is verified
          await sendPasswordResetEmail(auth, emailClean, {
            url: `${window.location.origin}/login`,
          });

          // Clean up OTP record
          if (db) {
            const docKey = emailClean.replace(/[@.]/g, "_");
            await deleteDoc(doc(db, "passwordResets", docKey));
          }

          toast.success(
            "Identidade verificada! Enviámos o link final de redefinição de palavra-passe para o seu e-mail. Por favor clique nele para concluir.",
            { duration: 8000 }
          );
        }
        navigate({ to: "/login" });
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found") {
        toast.error("Nenhuma conta AMOI encontrada com este e-mail.");
      } else {
        toast.error(err.message || "Erro ao redefinir a palavra-passe.");
      }
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
                ? "Introduza o seu e-mail para receber um código de verificação AMOI."
                : step === 2
                  ? `Introduza o código de 6 dígitos enviado para ${email}.`
                  : oobCode
                    ? "O link de redefinição foi detetado. Defina a sua nova palavra-passe abaixo."
                    : "Código verificado! Defina agora a sua nova palavra-passe."}
            </p>
          </div>

          {/* Progress indicator */}
          {!oobCode && (
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= s ? "bg-primary" : "bg-border"}`} />
              ))}
            </div>
          )}

          {step === 1 && (
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
                  "Enviar Código de Verificação"
                )}
              </Button>
            </form>
          )}

          {step === 2 && !oobCode && (
            /* STEP 2: Enter OTP */
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-[11px] text-muted-foreground leading-relaxed">
                <Mail className="h-4 w-4 text-primary inline mr-1 -mt-0.5" />
                Código enviado para <strong>{email}</strong>. Verifique também a pasta de spam.
              </div>

              <div className="space-y-2">
                <Label htmlFor="code" className="text-xs uppercase tracking-wider text-muted-foreground">Código de Verificação (6 Dígitos)</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    id="code"
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Ex: 123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="pl-10 tracking-[0.35em] text-center font-bold text-lg bg-background/50 border-border/60"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading || code.length < 6} className="w-full bg-gradient-gold text-primary-foreground font-semibold shadow-gold py-5">
                {loading ? (
                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> A verificar...</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Verificar Código</>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground pt-1 flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Reenviar código / outro e-mail
              </button>
            </form>
          )}

          {(step === 3 || oobCode) && (
            /* STEP 3: New password */
            <form onSubmit={handleResetPassword} className="space-y-4">
              {oobCode && (
                <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-[11px] text-muted-foreground leading-relaxed">
                  <ShieldCheck className="h-4 w-4 text-primary inline mr-1 -mt-0.5" />
                  <strong>Link seguro ativo</strong>: Pode definir a sua nova palavra-passe diretamente abaixo.
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
                {loading ? "A processar..." : oobCode ? "Redefinir Palavra-passe" : "Confirmar e Enviar Link Final"}
              </Button>

              {!oobCode && (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground pt-1 flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Voltar para verificação do código
                </button>
              )}
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
