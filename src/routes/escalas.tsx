import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../hooks/useAuth";
import logoUrl from "@/assets/amoi-logo.png";
import {
  ChurchScale,
  ScaleSlot,
  getDynamicScales,
  saveDynamicScale,
  deleteDynamicScale,
  ChurchInterveniente,
  getDynamicIntervenientes,
  saveDynamicInterveniente,
  deleteDynamicInterveniente,
  getDynamicServants,
  ChurchServant,
  ChurchUser,
  getDynamicUsers
} from "../lib/dynamicContent";
import {
  Calendar,
  Lock,
  Plus,
  Trash2,
  Save,
  FileText,
  Clock,
  User,
  BookOpen,
  ArrowLeft,
  Loader2,
  FileDown,
  Edit,
  ArrowUp,
  ArrowDown,
  Mail
} from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
// Brevo API key for browser-side email sending with PDF attachment
const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY as string;

export const Route = createFileRoute("/escalas")({
  head: () => ({
    meta: [
      { title: "Gestão de Escalas — AMOI" },
      { name: "description", content: "Elaboração e exportação de escalas de atividades da AMOI." },
    ],
  }),
  component: ScalesDashboard,
});

type ScalePeriod = "Todas" | "Semanal" | "Mensal" | "Trimestral" | "Semestral" | "Anual";

const formatScaleDate = (dateString: string) => {
  if (!dateString) return { month: "", dayOfMonth: "" };
  const [year, monthStr, dayStr] = dateString.split("-").map(Number);
  const date = new Date(year, monthStr - 1, dayStr);
  const months = [
    "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
    "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
  ];
  const daysOfWeek = [
    "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
    "Quinta-feira", "Sexta-feira", "Sábado"
  ];
  const month = months[date.getMonth()];
  const formattedDate = `${dayStr.toString().padStart(2, "0")}/${monthStr.toString().padStart(2, "0")}/${year}`;
  const dayName = daysOfWeek[date.getDay()];
  return { month, dayOfMonth: `${dayName} - ${formattedDate}` };
};

const sortScaleSlots = (slotsList: ScaleSlot[]): ScaleSlot[] => {
  return [...slotsList].sort((a, b) => {
    if (a.slotDate && b.slotDate) {
      return a.slotDate.localeCompare(b.slotDate);
    }
    const parseDateStr = (slot: ScaleSlot): string => {
      if (slot.slotDate) return slot.slotDate;
      const match = slot.dayOfMonth.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (match) {
        return `${match[3]}-${match[2]}-${match[1]}`;
      }
      return "";
    };
    const dateA = parseDateStr(a);
    const dateB = parseDateStr(b);
    if (dateA && dateB) {
      return dateA.localeCompare(dateB);
    }
    if (dateA) return -1;
    if (dateB) return 1;
    return 0;
  });
};
function ScalesDashboard() {
  const { user, loading } = useAuth();
  
  // States
  const [scales, setScales] = useState<ChurchScale[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<ScalePeriod>("Todas");
  
  // Send Email State
  const [users, setUsers] = useState<ChurchUser[]>([]);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedUserEmails, setSelectedUserEmails] = useState<string[]>([]);
  const [customEmails, setCustomEmails] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  
  // Custom Participants and Servants States
  const [servants, setServants] = useState<ChurchServant[]>([]);
  const [intervenientes, setIntervenientes] = useState<ChurchInterveniente[]>([]);
  const [newIntervenienteName, setNewIntervenienteName] = useState("");
  const [addingInterveniente, setAddingInterveniente] = useState(false);
  
  // Selection and Edit State
  const [selectedScale, setSelectedScale] = useState<ChurchScale | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | undefined>(undefined);
  
  // Form Fields
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<"Semanal" | "Mensal" | "Trimestral" | "Semestral" | "Anual">("Semanal");
  const [slots, setSlots] = useState<ScaleSlot[]>([
    {
      activity: "Culto de Adoração",
      details: "Moderação: Anciã. Maria Júlia\nOração de abertura (5min)\nLouvores: Irmãos: Paulo, Igor, Maria do Céu e Katia (40min)\n➤ Boas-vindas aos Visitantes\n➤ Ofertas e Dízimos - Com louvores mexidos\n➤ Testemunhos:\n➤ Grupo Coral Central\n➤ Ensinamento da Palavra: Serva Elizabeth(1h)\n➤ Avisos",
      month: "JUNHO",
      dayOfMonth: "Domingo - 14/06/2026"
    }
  ]);

  // Load Scales, Servants, Intervenientes, and Users
  useEffect(() => {
    let active = true;

    getDynamicScales().then((fetched) => {
      if (active) {
        setScales(fetched);
        setLoadingData(false);
      }
    });
    getDynamicServants().then((fetched) => {
      if (active) {
        setServants(fetched);
      }
    });
    getDynamicIntervenientes().then((fetched) => {
      if (active) {
        setIntervenientes(fetched);
      }
    });
    getDynamicUsers().then((fetched) => {
      if (active) {
        setUsers(fetched);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Filtered list
  const filteredScales = scales.filter(s => filterPeriod === "Todas" || s.type === filterPeriod);

  // Authorization Check
  if (loading) {
    return (
      <SiteLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </SiteLayout>
    );
  }

  if (!user) {
    return (
      <SiteLayout>
        <section className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-4 py-16">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: "var(--gradient-radial-gold)" }} />
          <div className="relative max-w-md w-full text-center bg-card/60 backdrop-blur-xl border border-primary/20 rounded-3xl p-10 shadow-elevated">
            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary mb-6 border border-primary/30">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="font-display text-2xl font-bold">Acesso Restrito</h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Esta página é destinada apenas aos membros da Secretaria e Administração da AMOI para elaboração de escalas.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Button asChild className="bg-gradient-gold text-primary-foreground font-semibold shadow-gold">
                <Link to="/login">Fazer Login</Link>
              </Button>
              <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                <Link to="/">Voltar para o Início</Link>
              </Button>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

  const isAuthorized = user.role === "Servo de Deus" || user.role === "Secretaria";

  if (!isAuthorized) {
    return (
      <SiteLayout>
        <section className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-4 py-16">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: "var(--gradient-radial-gold)" }} />
          <div className="relative max-w-md w-full text-center bg-card/60 backdrop-blur-xl border border-red-500/20 rounded-3xl p-10 shadow-elevated">
            <div className="h-16 w-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto text-red-500 mb-6 border border-red-500/30">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="font-display text-2xl font-bold text-red-500">Acesso Negado</h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Lamentamos, mas a sua conta atual (<strong className="text-primary">{user.displayName || user.email}</strong>) não tem permissões para aceder a esta página.
            </p>
            <div className="mt-8">
              <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                <Link to="/">Voltar para o Início</Link>
              </Button>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

  // Helper to generate the PDF document object
  const generatePDFDoc = (scale: ChurchScale) => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    
    // Load and add AMOI logo image
    const img = new Image();
    img.src = logoUrl;
    
    // Draw Logo at top left
    doc.addImage(img, "PNG", 14, 10, 22, 22);
    
    // Document Title/Metadata next to the Logo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 15, 17); // Dark
    doc.text("MINISTÉRIO DE ORAÇÃO E INTERCESSÃO", 40, 16);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(212, 175, 55); // Gold
    doc.text("AMOI", 40, 22);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(120, 120, 120);
    doc.text("BRAVOS GUERREIROS DA FÉ", 40, 27);
    
    doc.setDrawColor(212, 175, 55); // Gold line
    doc.setLineWidth(0.5);
    doc.line(14, 34, 283, 34);
    
    // Subtitle / Page Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 15, 17);
    doc.text(`CRONOGRAMA DE ATIVIDADES: ${scale.title.toUpperCase()}`, 14, 42);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`Tipo da Escala: ${scale.type}    |    Data de Elaboração: ${scale.date}`, 14, 47);
    
    // Mapping Rows to exactly match user's custom columns:
    const sorted = sortScaleSlots(scale.slots);
    const tableRows = sorted.map(s => [
      s.activity || "",
      s.details || "",
      s.month || "",
      s.dayOfMonth || ""
    ]);
    
    autoTable(doc, {
      startY: 52,
      head: [["Atividades da Semana", "Intercessor do Dia / Detalhes", "Mês", "Dias do mês"]],
      body: tableRows,
      headStyles: {
        fillColor: [126, 168, 224], // Light blue header matching user template (#7ea8e0)
        textColor: [0, 0, 0], // Black text
        font: "helvetica",
        fontStyle: "bold",
        fontSize: 9.5,
        halign: "left"
      },
      styles: {
        font: "helvetica",
        fontStyle: "normal",
        fontSize: 9,
        cellPadding: 4,
        lineColor: [200, 200, 205],
        lineWidth: 0.1,
        textColor: [15, 15, 17],
        valign: "top"
      },
      columnStyles: {
        0: { cellWidth: 55 }, // Atividades
        1: { cellWidth: 145 }, // Intercessor do Dia / Detalhes (plenty of horizontal space)
        2: { cellWidth: 30 }, // Mês
        3: { cellWidth: 39 }  // Dias do mês
      },
      margin: { top: 52 }
    });
    
    // Page numbering footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(150, 150, 150);
      doc.text("Associação Ministério de Oração e Intercessão · Secretaria Geral", 14, 198);
      doc.text(`Página ${i} de ${pageCount}`, 265, 198);
    }
    
    return doc;
  };

  // PDF Generator Function matching user's custom scale sheet model
  const handleExportPDF = (scale: ChurchScale) => {
    try {
      const doc = generatePDFDoc(scale);
      doc.save(`escala_${scale.type.toLowerCase()}_${scale.date}.pdf`);
      toast.success("Escala exportada para PDF com sucesso!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF.");
    }
  };

  // Start Form for Creating Scale
  const handleStartCreate = () => {
    setEditId(undefined);
    setTitle("");
    setDate(new Date().toISOString().split("T")[0]);
    setType("Semanal");
    setSlots([
      {
        activity: "Culto de Adoração",
        details: "Moderação: \nOração de abertura (5min)\nLouvores: (40min)\n➤ Boas-vindas aos Visitantes\n➤ Ofertas e Dízimos - Com louvores mexidos\n➤ Testemunhos:\n➤ Grupo Coral Central\n➤ Ensinamento da Palavra: (1h)\n➤ Avisos",
        month: "JUNHO",
        dayOfMonth: "Domingo - 14/06/2026"
      }
    ]);
    setIsEditing(true);
  };

  // Start Editing Existing Scale
  const handleStartEdit = (scale: ChurchScale) => {
    setEditId(scale.id);
    setTitle(scale.title);
    setDate(scale.date);
    setType(scale.type);
    setSlots([...scale.slots]);
    setIsEditing(true);
  };

  // Add Row
  const handleAddSlot = () => {
    setSlots([...slots, { activity: "", details: "", month: "", dayOfMonth: "" }]);
  };

  // Remove Row
  const handleRemoveSlot = (index: number) => {
    setSlots(slots.filter((_, idx) => idx !== index));
  };

  // Update Input Row
  const handleUpdateSlotField = (index: number, field: keyof ScaleSlot, val: string) => {
    const updated = slots.map((s, idx) => {
      if (idx === index) {
        return { ...s, [field]: val };
      }
      return s;
    });
    setSlots(updated);
  };

  // Move Slot Up
  const handleMoveSlotUp = (index: number) => {
    if (index === 0) return;
    const updated = [...slots];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setSlots(updated);
  };

  // Move Slot Down
  const handleMoveSlotDown = (index: number) => {
    if (index === slots.length - 1) return;
    const updated = [...slots];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setSlots(updated);
  };

  // Save
  const handleSaveScale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      toast.error("Por favor, preencha o título e a data.");
      return;
    }
    
    // Filter empty rows
    const cleanedSlots = slots.filter(s => s.activity.trim() || s.details.trim());
    if (cleanedSlots.length === 0) {
      toast.error("A escala deve conter pelo menos uma atividade preenchida.");
      return;
    }

    try {
      const sortedSlots = sortScaleSlots(cleanedSlots);
      const dataToSave = {
        id: editId,
        title: title.trim(),
        date,
        type,
        slots: sortedSlots
      };
      
      const savedId = await saveDynamicScale(dataToSave);
      
      // Update local state list
      const savedObj: ChurchScale = { ...dataToSave, id: savedId };
      setScales(prev => {
        const idx = prev.findIndex(s => s.id === savedId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = savedObj;
          return updated;
        }
        return [savedObj, ...prev];
      });

      setSelectedScale(savedObj);
      setIsEditing(false);
      toast.success("Escala gravada com sucesso!");
    } catch (err) {
      toast.error("Falha ao gravar a escala.");
    }
  };

  // Delete
  const handleDeleteScale = async (id: string) => {
    if (!window.confirm("Deseja realmente eliminar esta escala?")) return;
    try {
      await deleteDynamicScale(id);
      setScales(prev => prev.filter(s => s.id !== id));
      if (selectedScale?.id === id) {
        setSelectedScale(null);
      }
      toast.success("Escala eliminada.");
    } catch (err) {
      toast.error("Falha ao apagar.");
    }
  };

  // Add Custom Participant
  const handleAddInterveniente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIntervenienteName.trim()) return;
    setAddingInterveniente(true);
    try {
      const savedId = await saveDynamicInterveniente(newIntervenienteName.trim());
      const newItem = { id: savedId, name: newIntervenienteName.trim() };
      setIntervenientes(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)));
      setNewIntervenienteName("");
      toast.success("Participante registado!");
    } catch (err) {
      toast.error("Erro ao registar participante.");
    } finally {
      setAddingInterveniente(false);
    }
  };

  // Delete Custom Participant
  const handleDeleteInterveniente = async (id: string) => {
    if (!window.confirm("Deseja remover este participante?")) return;
    try {
      await deleteDynamicInterveniente(id);
      setIntervenientes(prev => prev.filter(item => item.id !== id));
      toast.success("Participante removido.");
    } catch (err) {
      toast.error("Falha ao remover.");
    }
  };

  // Helper to generate text representation of scale
  const generateEmailText = (scale: ChurchScale): string => {
    let text = `CRONOGRAMA DE ATIVIDADES: ${scale.title.toUpperCase()}\n`;
    text += `Tipo: ${scale.type} | Data de Elaboração: ${scale.date}\n\n`;
    text += `==========================================\n\n`;
    
    const sorted = sortScaleSlots(scale.slots);
    sorted.forEach((s) => {
      text += `ATALHO / MOMENTO: ${s.activity.toUpperCase()}\n`;
      text += `MÊS: ${s.month} | DATA: ${s.dayOfMonth}\n`;
      text += `DETALHES:\n${s.details}\n`;
      text += `==========================================\n\n`;
    });
    
    text += `Gerado eletronicamente pela Secretaria da AMOI.`;
    return text;
  };

  // Trigger modal and auto-select all newsletter users
  const handleOpenEmailDialog = () => {
    if (!selectedScale) return;
    // Auto-select all users with newsletter checked
    const defaultSelected = users.filter(u => u.newsletter).map(u => u.email);
    setSelectedUserEmails(defaultSelected);
    setCustomEmails("");
    setEmailSearch("");
    setShowEmailDialog(true);
  };

  // Handle email send via Brevo API with PDF attachment
  const handleSendSMTP = async () => {
    if (!selectedScale) return;

    // Parse custom emails
    const customList = customEmails
      .split(",")
      .map(e => e.trim())
      .filter(e => e.length > 0 && e.includes("@"));

    const allRecipients = Array.from(new Set([...selectedUserEmails, ...customList]));

    if (allRecipients.length === 0) {
      toast.error("Por favor, selecione ou adicione pelo menos um e-mail destinatário.");
      return;
    }

    setSendingEmail(true);
    const toastId = toast.loading(`A gerar PDF e a enviar para ${allRecipients.length} destinatário(s)...`);

    // 1. Generate PDF
    let pdfBase64 = "";
    try {
      const doc = generatePDFDoc(selectedScale);
      const raw = doc.output("datauristring");
      pdfBase64 = raw.includes("base64,") ? raw.split("base64,")[1] : raw;
    } catch (pdfErr) {
      console.error("PDF generation error:", pdfErr);
      toast.error("Falha ao gerar o documento PDF.", { id: toastId });
      setSendingEmail(false);
      return;
    }

    // 2. Build HTML email body
    const sorted = sortScaleSlots(selectedScale.slots);
    const slotRows = sorted.map(s => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 14px; font-size: 13px; color: #374151; vertical-align: top;">${s.activity}</td>
        <td style="padding: 10px 14px; font-size: 13px; color: #374151; vertical-align: top; white-space: nowrap;">${s.dayOfMonth}</td>
        <td style="padding: 10px 14px; font-size: 13px; color: #374151; white-space: pre-wrap; vertical-align: top;">${s.details}</td>
      </tr>
    `).join("");

    const htmlContent = `
      <div style="font-family: Georgia, serif; max-width: 680px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px 28px; text-align: center;">
          <h1 style="color: #D4A017; font-size: 28px; margin: 0 0 6px 0; letter-spacing: 3px;">AMOI</h1>
          <p style="color: #9ca3af; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Associação Ministério de Oração e Intercessão</p>
        </div>
        <div style="padding: 28px;">
          <h2 style="color: #111827; font-size: 20px; margin: 0 0 6px 0;">Cronograma de Atividades</h2>
          <p style="color: #D4A017; font-size: 16px; font-weight: bold; margin: 0 0 20px 0;">${selectedScale.title}</p>
          <p style="color: #6b7280; font-size: 13px; margin: 0 0 24px 0;">Olá, saudação em Cristo Jesus.<br/>Em anexo encontra o cronograma oficial de atividades da AMOI em formato PDF.</p>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #D4A017;">Momento / Atividade</th>
                <th style="padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #D4A017;">Data</th>
                <th style="padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #D4A017;">Detalhes / Intervenientes</th>
              </tr>
            </thead>
            <tbody>${slotRows}</tbody>
          </table>
        </div>
        <div style="background: #f9fafb; padding: 18px 28px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">Este é um e-mail automático enviado pela Secretaria Geral da AMOI &middot; Luanda, Angola</p>
        </div>
      </div>
    `;

    const pdfFilename = `escala_${selectedScale.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`;
    const subject = `[AMOI] Cronograma de Atividades: ${selectedScale.title}`;

    // 3. Send via Brevo API (single call, BCC all recipients, PDF attached)
    try {
      const payload = {
        sender: { name: "AMOI", email: "no-reply@ministerioamoi.it.ao" },
        to: [{ email: "no-reply@ministerioamoi.it.ao", name: "AMOI" }],
        bcc: allRecipients.map(email => ({ email })),
        subject,
        htmlContent,
        attachment: [
          {
            name: pdfFilename,
            content: pdfBase64,
          }
        ]
      };

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "api-key": BREVO_API_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(`Escala enviada com sucesso (com PDF em anexo) para ${allRecipients.length} destinatário(s)!`, { id: toastId });
        setShowEmailDialog(false);
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error("Brevo API error:", errData);
        toast.error(`Falha no envio: ${(errData as any)?.message || response.statusText}`, { id: toastId });
      }
    } catch (err: any) {
      console.error("Brevo fetch error:", err);
      toast.error(`Erro de rede ao enviar via Brevo: ${err.message}`, { id: toastId });
    } finally {
      setSendingEmail(false);
    }
  };


  // Copy selected email addresses list to clipboard
  const handleCopyEmails = () => {
    const customList = customEmails
      .split(",")
      .map(e => e.trim())
      .filter(e => e.length > 0 && e.includes("@"));

    const allRecipients = Array.from(new Set([...selectedUserEmails, ...customList]));
    if (allRecipients.length === 0) {
      toast.error("Nenhum destinatário selecionado.");
      return;
    }

    navigator.clipboard.writeText(allRecipients.join(", "));
    toast.success("Lista de e-mails copiada!");
  };

  // Copy scale text directly to clipboard
  const handleCopyScaleText = () => {
    if (!selectedScale) return;
    navigator.clipboard.writeText(generateEmailText(selectedScale));
    toast.success("Texto da escala copiado com sucesso!");
  };

  return (
    <SiteLayout>
      <section className="relative py-24 min-h-screen">
        {/* Glow decorative */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/60 pb-8 mb-10">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold flex items-center gap-1.5 mb-2">
                <FileText className="h-4 w-4" /> Gestão de Escalas
              </span>
              <h1 className="text-3xl md:text-4xl font-bold font-display">Cronogramas & Escalas</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Utilize esta secção para programar os cultos da semana/mês e exportar relatórios em formato PDF idênticos ao modelo oficial.
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button asChild variant="outline" className="border-border/60 hover:bg-muted">
                <Link to="/admin">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Painel Geral
                </Link>
              </Button>
              <Button onClick={handleStartCreate} className="bg-gradient-gold text-primary-foreground font-semibold shadow-gold cursor-pointer">
                <Plus className="mr-2 h-4 w-4" /> Nova Escala
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            {/* List Sidebar - 4 cols */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="p-6 rounded-3xl bg-card border border-border/60 shadow-elevated">
                <h3 className="font-display font-bold text-lg mb-4 text-primary">Filtrar Período</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(["Todas", "Semanal", "Mensal", "Trimestral", "Semestral", "Anual"] as ScalePeriod[]).map((period) => (
                    <button
                      key={period}
                      onClick={() => setFilterPeriod(period)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        filterPeriod === period
                          ? "bg-gradient-gold border-transparent text-primary-foreground shadow-gold"
                          : "bg-card/40 border-border/40 text-muted-foreground hover:text-primary hover:border-primary/20"
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scales list */}
              <div className="p-6 rounded-3xl bg-card border border-border/60 shadow-elevated flex-1 min-h-[400px] flex flex-col">
                <h3 className="font-display font-bold text-lg mb-4">Escalas Gravadas</h3>
                {loadingData ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  </div>
                ) : filteredScales.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                    <Calendar className="h-8 w-8 mb-2 opacity-40 text-primary" />
                    <p className="text-xs">Nenhuma escala registada para o filtro selecionado.</p>
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                    {filteredScales.map((scale) => (
                      <div
                        key={scale.id}
                        onClick={() => {
                          if (!isEditing) {
                            setSelectedScale(scale);
                          }
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          selectedScale?.id === scale.id && !isEditing
                            ? "bg-primary/10 border-primary"
                            : "bg-card/40 border-border/50 hover:border-primary/30"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-primary/20 text-primary font-bold rounded-full">
                            {scale.type}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">{scale.date}</span>
                        </div>
                        <h4 className="font-semibold text-sm mt-2 text-foreground line-clamp-1">{scale.title}</h4>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {scale.slots.length} cultos agendados.
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Participantes Comuns list */}
              <div className="p-6 rounded-3xl bg-card border border-border/60 shadow-elevated">
                <h3 className="font-display font-bold text-lg mb-2 text-primary flex items-center gap-1.5">
                  <User className="h-5 w-5" /> Participantes Comuns
                </h3>
                <p className="text-[11px] text-muted-foreground mb-4">
                  Cadastre nomes frequentes para inserção rápida nos detalhes da escala.
                </p>

                {/* Form to add */}
                <form onSubmit={handleAddInterveniente} className="flex gap-2 mb-4">
                  <Input
                    placeholder="Ex: Irmão Paulo"
                    value={newIntervenienteName}
                    onChange={(e) => setNewIntervenienteName(e.target.value)}
                    className="h-9 text-xs bg-card/50"
                  />
                  <Button
                    type="submit"
                    disabled={addingInterveniente || !newIntervenienteName.trim()}
                    className="h-9 px-3 bg-gradient-gold text-primary-foreground font-bold text-xs shrink-0 cursor-pointer"
                  >
                    Adicionar
                  </Button>
                </form>

                {/* List of registered participants */}
                {intervenientes.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground text-center py-2 italic">
                    Nenhum participante customizado.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {intervenientes.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-card/40 border border-border/40 hover:border-primary/20 transition-all text-xs"
                      >
                        <span className="font-medium text-foreground truncate">{item.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteInterveniente(item.id)}
                          className="p-1 text-muted-foreground hover:text-red-500 rounded transition-colors cursor-pointer"
                          title="Remover participante"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Scale Area - 8 cols */}
            <div className="lg:col-span-8">
              {isEditing ? (
                /* EDIT FORM */
                <form onSubmit={handleSaveScale} className="p-8 rounded-3xl bg-card border border-border/60 shadow-elevated space-y-6">
                  <h3 className="font-display font-bold text-xl text-primary flex items-center gap-2">
                    <Plus className="h-5 w-5" /> {editId ? "Editar Escala" : "Elaborar Nova Escala"}
                  </h3>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="scale-title">Título do Cronograma / Escala</Label>
                      <Input
                        id="scale-title"
                        placeholder="Ex: Escala de Junho - Julho 2026"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="bg-card/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scale-type">Período</Label>
                      <select
                        id="scale-type"
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                        className="w-full h-10 px-3 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-primary"
                      >
                        <option value="Semanal">Semanal</option>
                        <option value="Mensal">Mensal</option>
                        <option value="Trimestral">Trimestral</option>
                        <option value="Semestral">Semestral</option>
                        <option value="Anual">Anual</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="scale-date">Data de Elaboração</Label>
                      <Input
                        id="scale-date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="bg-card/50"
                      />
                    </div>
                  </div>

                  {/* Slot Items */}
                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-semibold text-foreground">Tabela de Cultos e Atividades</Label>
                      <Button
                        type="button"
                        onClick={handleAddSlot}
                        size="sm"
                        variant="outline"
                        className="border-primary/20 hover:bg-primary/10 text-primary font-bold cursor-pointer"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Adicionar Linha de Culto
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {slots.map((slot, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-2xl bg-card/60 border border-border/50 space-y-3 relative group"
                        >
                          {/* Row controls */}
                          <div className="absolute right-3 top-3 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleMoveSlotUp(index)}
                              disabled={index === 0}
                              className="p-1 rounded hover:bg-muted disabled:opacity-20 text-muted-foreground cursor-pointer"
                              title="Mover para Cima"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSlotDown(index)}
                              disabled={index === slots.length - 1}
                              className="p-1 rounded hover:bg-muted disabled:opacity-20 text-muted-foreground cursor-pointer"
                              title="Mover para Baixo"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSlot(index)}
                              className="p-1 rounded hover:bg-red-500/10 text-red-500 hover:text-red-500 ml-1 cursor-pointer"
                              title="Eliminar Linha"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="grid md:grid-cols-12 gap-3 pr-16">
                            <div className="md:col-span-3 space-y-1">
                              <Label className="text-[10px] uppercase text-muted-foreground">Atividade / Culto</Label>
                              <Input
                                placeholder="Ex: Culto de Adoração"
                                value={slot.activity}
                                onChange={(e) => handleUpdateSlotField(index, "activity", e.target.value)}
                                className="h-8 text-xs bg-card/50"
                              />
                            </div>
                            <div className="md:col-span-3 space-y-1">
                              <Label className="text-[10px] uppercase text-gradient-gold font-semibold">Calendário (Dia)</Label>
                              <Input
                                type="date"
                                value={slot.slotDate || ""}
                                onChange={(e) => {
                                  const dateVal = e.target.value;
                                  if (dateVal) {
                                    const formatted = formatScaleDate(dateVal);
                                    const updated = slots.map((s, idx) => {
                                      if (idx === index) {
                                        return { 
                                          ...s, 
                                          month: formatted.month, 
                                          dayOfMonth: formatted.dayOfMonth,
                                          slotDate: dateVal 
                                        };
                                      }
                                      return s;
                                    });
                                    setSlots(updated);
                                  }
                                }}
                                className="h-8 text-xs bg-card/50 font-semibold text-primary cursor-pointer"
                              />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                              <Label className="text-[10px] uppercase text-muted-foreground">Mês</Label>
                              <Input
                                placeholder="Ex: JUNHO"
                                value={slot.month}
                                onChange={(e) => handleUpdateSlotField(index, "month", e.target.value)}
                                className="h-8 text-xs bg-card/50"
                              />
                            </div>
                            <div className="md:col-span-4 space-y-1">
                              <Label className="text-[10px] uppercase text-muted-foreground">Dias do Mês / Data</Label>
                              <Input
                                placeholder="Ex: Domingo - 14/06/2026"
                                value={slot.dayOfMonth}
                                onChange={(e) => handleUpdateSlotField(index, "dayOfMonth", e.target.value)}
                                className="h-8 text-xs bg-card/50"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <Label className="text-[10px] uppercase text-muted-foreground">Interveniente do Dia / Detalhes da Escala</Label>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-muted-foreground">Inserir rápido:</span>
                                <select
                                  value=""
                                  onChange={(e) => {
                                    const selectedName = e.target.value;
                                    if (selectedName) {
                                      const prevDetails = slot.details;
                                      const newDetails = prevDetails.trim() 
                                        ? prevDetails + "\n" + selectedName 
                                        : selectedName;
                                      handleUpdateSlotField(index, "details", newDetails);
                                      toast.success(`Inserido: ${selectedName}`);
                                    }
                                  }}
                                  className="text-[10px] bg-card border border-border/60 rounded px-2 py-0.5 focus:outline-none text-primary font-semibold"
                                >
                                  <option value="">— Selecione um nome —</option>
                                  {servants.length > 0 && (
                                    <optgroup label="Servos & Líderes (O Chamado)">
                                      {servants.map((srv) => (
                                        <option key={srv.id} value={srv.name}>
                                          {srv.name}
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                  {intervenientes.length > 0 && (
                                    <optgroup label="Participantes Comuns">
                                      {intervenientes.map((item) => (
                                        <option key={item.id} value={item.name}>
                                          {item.name}
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                              </div>
                            </div>
                            <textarea
                              placeholder="Escreva a escala (moderação, louvores, palavra, etc.) separando as linhas."
                              value={slot.details}
                              rows={5}
                              onChange={(e) => handleUpdateSlotField(index, "details", e.target.value)}
                              className="w-full p-2 text-xs bg-card/50 rounded-lg border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans leading-relaxed"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="border-border/60 cursor-pointer"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-gold text-primary-foreground font-semibold shadow-gold cursor-pointer"
                    >
                      <Save className="h-4 w-4 mr-2" /> Gravar Escala
                    </Button>
                  </div>
                </form>
              ) : selectedScale ? (
                /* PREVIEW & ACTIONS */
                <div className="p-8 rounded-3xl bg-card border border-border/60 shadow-elevated space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-primary/20 text-primary font-bold rounded-full">
                        {selectedScale.type}
                      </span>
                      <h2 className="text-2xl font-bold font-display text-primary mt-2">{selectedScale.title}</h2>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> Elaborado em: {selectedScale.date}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleStartEdit(selectedScale)}
                        variant="outline"
                        className="border-primary/20 text-primary hover:bg-primary/10 cursor-pointer"
                      >
                        <Edit className="h-4 w-4 mr-1.5" /> Editar
                      </Button>
                      <Button
                        onClick={() => handleDeleteScale(selectedScale.id)}
                        variant="outline"
                        className="border-red-500/20 text-red-500 hover:bg-red-500/10 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Detail Table */}
                  <div className="rounded-2xl overflow-hidden border border-border bg-card/40">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#7ea8e0] text-black border-b border-border/60 uppercase tracking-wider font-bold">
                            <th className="p-4 w-48 text-sm">Atividades da Semana</th>
                            <th className="p-4 text-sm">Intercessor do Dia / Detalhes</th>
                            <th className="p-4 w-28 text-sm">Mês</th>
                            <th className="p-4 w-48 text-sm">Dias do mês</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {sortScaleSlots(selectedScale.slots).map((s, idx) => (
                            <tr key={idx} className="hover:bg-muted/40 transition-colors">
                              <td className="p-4 font-semibold text-foreground align-top text-sm">{s.activity}</td>
                              <td className="p-4 text-foreground whitespace-pre-line leading-relaxed align-top text-xs">
                                {s.details}
                              </td>
                              <td className="p-4 text-muted-foreground font-semibold align-top text-xs">
                                {s.month}
                              </td>
                              <td className="p-4 text-muted-foreground font-semibold align-top text-xs">
                                {s.dayOfMonth}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-wrap justify-center gap-3">
                    <Button
                      onClick={() => handleExportPDF(selectedScale)}
                      className="bg-gradient-gold text-primary-foreground font-bold shadow-gold px-6 py-5 rounded-2xl text-xs tracking-wide cursor-pointer flex-1 sm:flex-initial"
                    >
                      <FileDown className="h-4.5 w-4.5 mr-2 animate-bounce" /> Exportar em PDF
                    </Button>
                    <Button
                      onClick={handleOpenEmailDialog}
                      variant="outline"
                      className="border-primary/30 text-primary hover:bg-primary/10 font-bold px-6 py-5 rounded-2xl text-xs tracking-wide cursor-pointer flex-1 sm:flex-initial"
                    >
                      <Mail className="h-4.5 w-4.5 mr-2" /> Enviar por E-mail (Massa)
                    </Button>
                    <Button
                      onClick={handleCopyScaleText}
                      variant="outline"
                      className="border-border hover:bg-muted font-bold px-6 py-5 rounded-2xl text-xs tracking-wide cursor-pointer flex-1 sm:flex-initial"
                    >
                      <Save className="h-4.5 w-4.5 mr-2" /> Copiar Texto da Escala
                    </Button>
                  </div>
                </div>
              ) : (
                /* EMPTY STATE */
                <div className="p-12 rounded-3xl bg-card border border-border/60 shadow-elevated text-center flex flex-col items-center justify-center min-h-[450px]">
                  <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 border border-primary/30">
                    <FileText className="h-8 w-8" />
                  </div>
                  <h3 className="font-display text-xl font-bold">Nenhuma Escala Selecionada</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mt-2">
                    Selecione uma escala na lista lateral ou crie uma nova para visualizar a escala de atividades detalhadas ou exportar em formato PDF.
                  </p>
                  <Button onClick={handleStartCreate} className="bg-gradient-gold text-primary-foreground font-semibold shadow-gold mt-6 cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" /> Elaborar Nova Escala
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* EMAIL DISPATCH DIALOG */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-2xl bg-card border border-border/80 rounded-3xl p-6 shadow-elevated text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-display text-primary flex items-center gap-2">
              <Mail className="h-5 w-5" /> Envio em Massa (Escala via E-mail)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Selecione os e-mails dos membros registados na base de dados e/ou adicione e-mails externos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            {/* Filter and selection tools */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <Input
                placeholder="Pesquisar utilizador por nome ou e-mail..."
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
                className="h-9 text-xs bg-muted/30 max-w-sm"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allEmails = users.map(u => u.email);
                    setSelectedUserEmails(allEmails);
                    toast.success("Todos os e-mails selecionados!");
                  }}
                  className="h-8 text-[11px] font-semibold border-border/60 hover:bg-muted"
                >
                  Selecionar Todos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedUserEmails([]);
                    toast.success("Seleção limpa!");
                  }}
                  className="h-8 text-[11px] font-semibold border-border/60 hover:bg-muted"
                >
                  Limpar Seleção
                </Button>
              </div>
            </div>

            {/* List with checkboxes */}
            <div className="border border-border/60 rounded-2xl bg-muted/10 p-4 max-h-[180px] overflow-y-auto space-y-2">
              {users.filter(u => 
                u.displayName?.toLowerCase().includes(emailSearch.toLowerCase()) ||
                u.email.toLowerCase().includes(emailSearch.toLowerCase())
              ).length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-4">Nenhum utilizador encontrado.</p>
              ) : (
                users.filter(u => 
                  u.displayName?.toLowerCase().includes(emailSearch.toLowerCase()) ||
                  u.email.toLowerCase().includes(emailSearch.toLowerCase())
                ).map((u) => {
                  const isChecked = selectedUserEmails.includes(u.email);
                  return (
                    <label
                      key={u.uid}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedUserEmails(prev => prev.filter(e => e !== u.email));
                          } else {
                            setSelectedUserEmails(prev => [...prev, u.email]);
                          }
                        }}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{u.displayName}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">{u.email}</p>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-muted text-muted-foreground font-bold rounded-full">
                        {u.role}
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            {/* Custom/External emails */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">
                Adicionar E-mails Externos (separados por vírgula)
              </Label>
              <Input
                placeholder="Ex: irmao.jose@gmail.com, visitante@yahoo.com"
                value={customEmails}
                onChange={(e) => setCustomEmails(e.target.value)}
                className="bg-card/50"
              />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Total de destinatários selecionados: <strong>{selectedUserEmails.length}</strong> (registados) + <strong>{customEmails.split(",").map(e => e.trim()).filter(e => e.includes("@")).length}</strong> (externos).
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyEmails}
              className="border-border/60 hover:bg-muted font-bold cursor-pointer"
            >
              Copiar Destinatários
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEmailDialog(false)}
                className="border-border/60 hover:bg-muted cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSendSMTP}
                disabled={sendingEmail}
                className="bg-gradient-gold text-primary-foreground font-bold shadow-gold cursor-pointer"
              >
                {sendingEmail ? (
                  <>A Enviar...</>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" /> Enviar PDF Diretamente
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}
