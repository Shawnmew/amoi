import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "../hooks/useAuth";
import {
  Music,
  Search,
  Plus,
  Trash2,
  Edit,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Loader2,
  FileText,
  FileDown
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  RepertoireSong,
  getDynamicRepertoire,
  saveDynamicRepertoireSong,
  deleteDynamicRepertoireSong
} from "../lib/dynamicContent";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import logoUrl from "@/assets/amoi-logo.png";

export const Route = createFileRoute("/repertorio")({
  head: () => ({
    meta: [
      { title: "Repertório de Louvor — AMOI" },
      { name: "description", content: "Repertório oficial de louvores e letras cantadas na AMOI." },
    ],
  }),
  component: Repertoire,
});

const cleanTextForPDF = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/[^\x00-\x7F\xC0-\xFF\s]/g, "")
    .trim();
};

function Repertoire() {
  const { user, loading } = useAuth();

  // Repertoire state
  const [songs, setSongs] = useState<RepertoireSong[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Bulk selection state
  const [selectedBulkIds, setSelectedBulkIds] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);

  // File Progress states
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [progressLabel, setProgressLabel] = useState("");

  // Modals state
  const [selectedSong, setSelectedSong] = useState<RepertoireSong | null>(null);
  const [addEditDialogOpen, setAddEditDialogOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<RepertoireSong | null>(null);

  // Form fields state
  const [formTitle, setFormTitle] = useState("");
  const [formArtist, setFormArtist] = useState("");
  const [formLyrics, setFormLyrics] = useState("");
  const [formIsPublic, setFormIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Import state
  const [importSongsList, setImportSongsList] = useState<RepertoireSong[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedImportIndexes, setSelectedImportIndexes] = useState<number[]>([]);
  const [importIsPublic, setImportIsPublic] = useState(true);

  // Fetch repertoire
  useEffect(() => {
    async function loadRepertoire() {
      if (!user) return;
      try {
        const data = await getDynamicRepertoire();
        setSongs(data);
      } catch (err) {
        console.error("Error fetching repertoire:", err);
      } finally {
        setLoadingSongs(false);
      }
    }
    loadRepertoire();
  }, [user]);

  // Auth roles
  const isBandaOrAdmin = user && (user.role === "Banda" || user.role === "Servo de Deus");

  // Filtering songs based on user role and query
  const filteredSongs = useMemo(() => {
    return songs
      .filter((song) => {
        // Privacy filter
        if (!isBandaOrAdmin && !song.isPublic) {
          return false;
        }
        // Search filter
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
          song.title.toLowerCase().includes(query) ||
          song.artist.toLowerCase().includes(query) ||
          song.lyrics.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [songs, searchQuery, isBandaOrAdmin]);

  // Open Form for Adding
  const handleOpenAdd = () => {
    setEditingSong(null);
    setFormTitle("");
    setFormArtist("");
    setFormLyrics("");
    setFormIsPublic(true);
    setAddEditDialogOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (song: RepertoireSong, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSong(song);
    setFormTitle(song.title);
    setFormArtist(song.artist);
    setFormLyrics(song.lyrics);
    setFormIsPublic(song.isPublic);
    setAddEditDialogOpen(true);
  };

  // Save Song (Create or Update)
  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formLyrics.trim()) {
      toast.error("O título e a letra são obrigatórios.");
      return;
    }

    setSubmitting(true);
    try {
      const newSong: RepertoireSong = {
        id: editingSong?.id || `song-${Date.now()}`,
        title: formTitle.trim(),
        artist: formArtist.trim() || "Autor Desconhecido",
        lyrics: formLyrics,
        isPublic: formIsPublic,
        createdAt: editingSong?.createdAt || Date.now(),
        createdBy: editingSong?.createdBy || user?.email || "desconhecido"
      };

      await saveDynamicRepertoireSong(newSong);
      
      // Update local state list
      setSongs((prev) => {
        const idx = prev.findIndex(s => s.id === newSong.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = newSong;
          return updated;
        }
        return [newSong, ...prev];
      });

      // Update active view if viewing the edited song
      if (selectedSong && selectedSong.id === newSong.id) {
        setSelectedSong(newSong);
      }

      toast.success(editingSong ? "Música atualizada com sucesso!" : "Música cadastrada no repertório!");
      setAddEditDialogOpen(false);
    } catch (err) {
      console.error("Error saving song:", err);
      toast.error("Erro ao guardar as alterações.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Song
  const handleDeleteSong = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Tem a certeza que deseja eliminar esta música do repertório?")) return;

    try {
      await deleteDynamicRepertoireSong(id);
      setSongs((prev) => prev.filter(s => s.id !== id));
      if (selectedSong && selectedSong.id === id) {
        setSelectedSong(null);
      }
      toast.success("Música eliminada com sucesso.");
    } catch (err) {
      console.error("Error deleting song:", err);
      toast.error("Erro ao eliminar a música.");
    }
  };

  // Copy Lyrics to Clipboard
  const handleCopyLyrics = (song: RepertoireSong) => {
    const textToCopy = `${song.title} - ${song.artist}\n\n${song.lyrics}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success("Letra copiada para a área de transferência!");
  };

  // Export selected songs to Holyrics JSON format
  const handleExportRepertoireJSON = async (selectedSongs: RepertoireSong[]) => {
    if (selectedSongs.length === 0) return;

    setProgressPercent(20);
    setProgressLabel("A iniciar exportação para JSON...");
    await new Promise(r => setTimeout(r, 200));

    const holyricsSongs = selectedSongs.map((song, index) => ({
      id: song.createdAt || (Date.now() + index),
      title: song.title,
      artist: song.artist,
      author: "",
      note: "",
      copyright: "",
      language: "",
      key: "",
      bpm: 0.0,
      time_sig: "",
      midi: null,
      order: "",
      arrangements: [],
      lyrics: {
        full_text: song.lyrics
      }
    }));

    setProgressPercent(60);
    setProgressLabel("A codificar ficheiro...");
    await new Promise(r => setTimeout(r, 250));

    const blob = new Blob([JSON.stringify(holyricsSongs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    setProgressPercent(90);
    setProgressLabel("A descarregar arquivo...");
    await new Promise(r => setTimeout(r, 200));

    const a = document.createElement("a");
    a.href = url;
    a.download = selectedSongs.length === 1 
      ? `holyrics_${selectedSongs[0].title.toLowerCase().replace(/\s+/g, "_")}.json`
      : `holyrics_repertorio_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setProgressPercent(100);
    setProgressLabel("Download concluído!");
    await new Promise(r => setTimeout(r, 300));
    setProgressPercent(null);
    setProgressLabel("");

    toast.success(`${selectedSongs.length} música(s) exportada(s) em JSON Holyrics!`);
  };

  // Export selected songs to PDF with AMOI logo
  const handleExportRepertoirePDF = async (selectedSongs: RepertoireSong[]) => {
    if (selectedSongs.length === 0) return;

    setProgressPercent(10);
    setProgressLabel("A iniciar exportação para PDF...");
    await new Promise(r => setTimeout(r, 300));

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const img = new Image();
    img.src = logoUrl;

    const total = selectedSongs.length;
    for (let i = 0; i < total; i++) {
      const song = selectedSongs[i];
      setProgressLabel(`A processar louvor ${i + 1} de ${total}: ${song.title}...`);
      setProgressPercent(Math.round(10 + (i / total) * 80));
      await new Promise(r => setTimeout(r, 200));

      if (i > 0) {
        doc.addPage();
      }

      // Draw Logo at top left
      doc.addImage(img, "PNG", 14, 10, 20, 20);
      
      // Header Text next to Logo
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 15, 17);
      doc.text("MINISTÉRIO DE ORAÇÃO E INTERCESSÃO", 38, 15);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(212, 175, 55); // Gold
      doc.text("AMOI", 38, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(120, 120, 120);
      doc.text("Repertório Oficial de Louvores", 38, 25);

      // Gold line
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.5);
      doc.line(14, 32, 196, 32);

      // Song Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(15, 15, 17);
      doc.text(cleanTextForPDF(song.title.toUpperCase()), 14, 43);

      // Artist
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Artista/Ministério: ${cleanTextForPDF(song.artist)}`, 14, 49);

      // Lyrics
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(30, 30, 30);

      const splitLyrics = doc.splitTextToSize(cleanTextForPDF(song.lyrics), 182);
      
      let y = 57;
      const lineHeight = 5.5;
      const pageHeight = doc.internal.pageSize.getHeight();

      splitLyrics.forEach((line: string) => {
        if (y + lineHeight > pageHeight - 15) {
          doc.addPage();
          // Draw header border line on new pages
          doc.setDrawColor(212, 175, 55);
          doc.setLineWidth(0.5);
          doc.line(14, 14, 196, 14);
          y = 22;
        }
        doc.text(line, 14, y);
        y += lineHeight;
      });
    }

    setProgressLabel("A finalizar documento...");
    setProgressPercent(95);
    await new Promise(r => setTimeout(r, 200));

    // Footer page numbering
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(150, 150, 150);
      doc.text("Associação Ministério de Oração e Intercessão · Louvor & Banda", 14, 287);
      doc.text(`Página ${p} de ${totalPages}`, 175, 287);
    }

    const filename = selectedSongs.length === 1 
      ? `louvor_${selectedSongs[0].title.toLowerCase().replace(/\s+/g, "_")}.pdf`
      : `repertorio_amoi_${Date.now()}.pdf`;
    
    doc.save(filename);
    
    setProgressPercent(100);
    setProgressLabel("Download concluído!");
    await new Promise(r => setTimeout(r, 300));
    setProgressPercent(null);
    setProgressLabel("");

    toast.success(`${selectedSongs.length} música(s) exportada(s) em PDF!`);
  };

  // Handle Holyrics JSON file upload & parsing
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const parsedSongs: RepertoireSong[] = [];
        
        const items = Array.isArray(parsed) ? parsed : [parsed];
        
        items.forEach((item: any, index: number) => {
          const title = item.title;
          const artist = item.artist || item.author || "Autor Desconhecido";
          const lyrics = item.lyrics?.full_text || (typeof item.lyrics === "string" ? item.lyrics : "");
          
          if (title && lyrics) {
            parsedSongs.push({
              id: `song-holyrics-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
              title: String(title).trim(),
              artist: String(artist).trim(),
              lyrics: String(lyrics).trim(),
              isPublic: importIsPublic,
              createdAt: Date.now() + index,
              createdBy: user?.email || "import_holyrics"
            });
          }
        });

        if (parsedSongs.length === 0) {
          toast.error("Nenhuma música válida com título e letra foi encontrada no arquivo.");
          return;
        }

        setImportSongsList(parsedSongs);
        setSelectedImportIndexes(parsedSongs.map((_, i) => i)); // all checked by default
        setImportDialogOpen(true);
        // Reset file input value
        e.target.value = "";
      } catch (err) {
        console.error("JSON parse error:", err);
        toast.error("Erro ao ler o arquivo JSON. Certifique-se de que é um arquivo JSON válido do Holyrics.");
      }
    };
    reader.readAsText(file);
  };

  // Confirm and save selected imported songs
  const handleConfirmImport = async () => {
    if (selectedImportIndexes.length === 0) {
      toast.error("Selecione pelo menos uma música para importar.");
      return;
    }

    setSubmitting(true);
    setProgressPercent(0);
    setProgressLabel("Iniciando importação...");
    let successCount = 0;
    let overwriteCount = 0;
    const updatedSongsList = [...songs];
    const total = selectedImportIndexes.length;

    try {
      for (let i = 0; i < total; i++) {
        const idx = selectedImportIndexes[i];
        const song = importSongsList[idx];
        song.isPublic = importIsPublic;

        setProgressLabel(`A importar: ${song.title}...`);
        setProgressPercent(Math.round((i / total) * 100));

        // Simulate small delay for premium progress visualization
        await new Promise(r => setTimeout(r, 200));

        // Check if song already exists by title
        const existingIdx = updatedSongsList.findIndex(
          (s) => s.title.toLowerCase().trim() === song.title.toLowerCase().trim()
        );

        if (existingIdx >= 0) {
          // Overwrite existing song
          song.id = updatedSongsList[existingIdx].id;
          song.createdAt = updatedSongsList[existingIdx].createdAt || song.createdAt;
          song.createdBy = updatedSongsList[existingIdx].createdBy || song.createdBy;
          
          await saveDynamicRepertoireSong(song);
          updatedSongsList[existingIdx] = song;
          overwriteCount++;
        } else {
          // New song
          await saveDynamicRepertoireSong(song);
          updatedSongsList.unshift(song);
          successCount++;
        }
      }

      setProgressPercent(100);
      setProgressLabel("Concluído!");
      await new Promise(r => setTimeout(r, 400));

      setSongs(updatedSongsList);
      
      if (overwriteCount > 0) {
        toast.success(`${successCount} música(s) importada(s) e ${overwriteCount} música(s) existente(s) atualizada(s)!`);
      } else {
        toast.success(`${successCount} música(s) importada(s) com sucesso!`);
      }
      
      setImportDialogOpen(false);
    } catch (err) {
      console.error("Error during import:", err);
      toast.error("Erro ao importar algumas músicas.");
    } finally {
      setSubmitting(false);
      setProgressPercent(null);
      setProgressLabel("");
    }
  };

  // Restrict screen for non-logged in users
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
              A página de Repertório oficial é privada e só pode estar visível para quem estiver cadastrado e autenticado no sistema.
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

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-border/40">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold flex items-center gap-2">
              <Music className="h-4 w-4" /> Banda & Ministério de Louvor
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">Repertório de Louvores</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Consulte e organize as letras das músicas cantadas na AMOI.
            </p>
          </div>

          {isBandaOrAdmin && (
            <div className="flex flex-wrap gap-2.5">
              <label className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold border border-border text-foreground hover:bg-muted transition-colors cursor-pointer select-none">
                <FileText className="h-4 w-4 mr-2 text-primary" /> Importar Holyrics (JSON)
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
              <Button
                onClick={handleOpenAdd}
                className="bg-gradient-gold text-primary-foreground font-bold shadow-gold cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" /> Adicionar Música
              </Button>
            </div>
          )}
        </div>

        {/* Search & Bulk Actions Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por título, artista ou letra..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border/60"
            />
          </div>

          <div className="flex flex-wrap gap-2.5 items-center w-full md:w-auto justify-end">
            {bulkMode ? (
              <>
                <span className="text-xs text-muted-foreground font-semibold px-2">
                  Selecionadas: <strong className="text-primary">{selectedBulkIds.length}</strong>
                </span>
                <Button
                  onClick={() => {
                    const allIds = filteredSongs.map(s => s.id);
                    if (selectedBulkIds.length === allIds.length) {
                      setSelectedBulkIds([]);
                    } else {
                      setSelectedBulkIds(allIds);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="border-border text-foreground text-xs font-semibold cursor-pointer"
                >
                  {selectedBulkIds.length === filteredSongs.length ? "Desmarcar Todas" : "Selecionar Todas"}
                </Button>
                <Button
                  onClick={() => {
                    const matchedSongs = songs.filter(s => selectedBulkIds.includes(s.id));
                    handleExportRepertoireJSON(matchedSongs);
                  }}
                  disabled={selectedBulkIds.length === 0}
                  variant="outline"
                  size="sm"
                  className="border-border text-foreground text-xs font-bold cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 mr-1 text-primary" /> Exportar JSON ({selectedBulkIds.length})
                </Button>
                <Button
                  onClick={() => {
                    const matchedSongs = songs.filter(s => selectedBulkIds.includes(s.id));
                    handleExportRepertoirePDF(matchedSongs);
                  }}
                  disabled={selectedBulkIds.length === 0}
                  variant="outline"
                  size="sm"
                  className="border-border text-foreground text-xs font-bold cursor-pointer"
                >
                  <FileDown className="h-3.5 w-3.5 mr-1 text-primary" /> Exportar PDF ({selectedBulkIds.length})
                </Button>
                <Button
                  onClick={() => {
                    setBulkMode(false);
                    setSelectedBulkIds([]);
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  setBulkMode(true);
                  setSelectedBulkIds([]);
                }}
                variant="outline"
                size="sm"
                className="border-border text-foreground text-xs font-semibold cursor-pointer"
              >
                <FileDown className="h-3.5 w-3.5 mr-2 text-primary" /> Seleção em Massa
              </Button>
            )}
          </div>
        </div>

        {loadingSongs ? (
          <div className="min-h-[200px] flex items-center justify-center">
            <Loader2 className="h-7 w-7 text-primary animate-spin" />
          </div>
        ) : (
          <>
            {/* Song Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSongs.map((song) => (
                <div
                  key={song.id}
                  onClick={() => {
                    if (bulkMode) {
                      const isSel = selectedBulkIds.includes(song.id);
                      setSelectedBulkIds(prev => 
                        isSel ? prev.filter(id => id !== song.id) : [...prev, song.id]
                      );
                    } else {
                      setSelectedSong(song);
                    }
                  }}
                  className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between shadow-elevated relative group ${
                    bulkMode && selectedBulkIds.includes(song.id)
                      ? "bg-primary/5 border-primary"
                      : "bg-card/40 border-border/60 hover:border-primary/50 hover:bg-card/70"
                  }`}
                >
                  <div>
                    {/* Privacy badge and indicators */}
                    <div className="flex justify-between items-center gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {bulkMode && (
                          <input
                            type="checkbox"
                            checked={selectedBulkIds.includes(song.id)}
                            readOnly
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
                          />
                        )}
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          {song.artist}
                        </span>
                      </div>
                      {isBandaOrAdmin && (
                        <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          song.isPublic 
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}>
                          {song.isPublic ? (
                            <><Eye className="h-3 w-3" /> Público</>
                          ) : (
                            <><EyeOff className="h-3 w-3" /> Privado Banda</>
                          )}
                        </span>
                      )}
                    </div>

                    <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {song.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-3 line-clamp-4 whitespace-pre-line font-sans leading-relaxed">
                      {song.lyrics}
                    </p>
                  </div>

                  {/* Actions inside card for authorized editors */}
                  <div className="flex justify-between items-center mt-5 pt-3 border-t border-border/40 text-[10px] text-muted-foreground">
                    <span>Toque para ver a letra</span>
                    {isBandaOrAdmin && (
                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleOpenEdit(song, e)}
                          className="p-1.5 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSong(song.id, e)}
                          className="p-1.5 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredSongs.length === 0 && (
              <div className="text-center py-16 bg-card/20 rounded-3xl border border-border/50">
                <Music className="h-10 w-10 text-muted-foreground/60 mx-auto mb-4" />
                <h3 className="font-semibold text-lg">Nenhuma música encontrada</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  A pesquisa não retornou resultados ou não há louvores cadastrados com permissão de leitura para o seu nível de acesso.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* VIEW SONG DETAILS DIALOG */}
      <Dialog open={selectedSong !== null} onOpenChange={(open) => !open && setSelectedSong(null)}>
        {selectedSong && (
          <DialogContent className="max-w-xl w-[95%] bg-card border border-border/80 rounded-3xl p-6 shadow-elevated text-foreground max-h-[85vh] overflow-y-auto">
            <DialogHeader className="pb-3 border-b border-border/40">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <DialogTitle className="text-xl font-bold font-display text-primary">
                    {selectedSong.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-1">
                    Cantada por: <strong>{selectedSong.artist}</strong>
                  </DialogDescription>
                </div>
                {isBandaOrAdmin && (
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    selectedSong.isPublic 
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  }`}>
                    {selectedSong.isPublic ? "Público" : "Privado (Banda)"}
                  </span>
                )}
              </div>
            </DialogHeader>

            <div className="py-4">
              <div className="bg-card/60 border border-border/40 p-5 rounded-2xl max-h-[45vh] overflow-y-auto font-sans leading-relaxed text-sm whitespace-pre-line shadow-inner">
                {selectedSong.lyrics}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-border/40">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCopyLyrics(selectedSong)}
                  className="border-border/60 hover:bg-muted font-semibold text-xs py-2 px-3 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleExportRepertoireJSON([selectedSong])}
                  className="border-border/60 hover:bg-muted font-semibold text-xs py-2 px-3 cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 mr-1 text-primary" /> JSON
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleExportRepertoirePDF([selectedSong])}
                  className="border-border/60 hover:bg-muted font-semibold text-xs py-2 px-3 cursor-pointer"
                >
                  <FileDown className="h-3.5 w-3.5 mr-1 text-primary" /> PDF
                </Button>
              </div>

              <div className="flex gap-2">
                {isBandaOrAdmin && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      const s = selectedSong;
                      setSelectedSong(null);
                      handleOpenEdit(s, e);
                    }}
                    className="border-border/60 hover:bg-muted font-semibold text-xs py-2 px-3 cursor-pointer"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={() => setSelectedSong(null)}
                  className="bg-muted text-foreground hover:bg-muted/80 font-bold text-xs py-2 px-4 cursor-pointer"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* ADD / EDIT SONG DIALOG */}
      <Dialog open={addEditDialogOpen} onOpenChange={setAddEditDialogOpen}>
        <DialogContent className="max-w-lg w-[95%] bg-card border border-border/80 rounded-3xl p-6 shadow-elevated text-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3 border-b border-border/40">
            <DialogTitle className="text-lg font-bold font-display text-primary flex items-center gap-2">
              <Music className="h-5 w-5" /> {editingSong ? "Editar Música" : "Cadastrar Nova Música"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Preencha os dados da música a ser guardada no repertório oficial da AMOI.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSong} className="space-y-4 py-3">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="song-title" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Título do Louvor</Label>
                <Input
                  id="song-title"
                  placeholder="Ex: Grandes Coisas"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="bg-card border-border/60 h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="song-artist" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Artista / Ministério</Label>
                <Input
                  id="song-artist"
                  placeholder="Ex: Fernandinho"
                  value={formArtist}
                  onChange={(e) => setFormArtist(e.target.value)}
                  className="bg-card border-border/60 h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="song-lyrics" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Letra Completa</Label>
              <Textarea
                id="song-lyrics"
                placeholder="Insira as estrofes e o coro da música..."
                value={formLyrics}
                onChange={(e) => setFormLyrics(e.target.value)}
                className="bg-card border-border/60 min-h-[220px] text-xs font-sans leading-relaxed"
              />
            </div>

            {/* VISIBILITY TOGGLE */}
            <div className="p-4 bg-muted/40 border border-border/50 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-xs font-bold text-foreground">Disponível para leitura pública?</h4>
                <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                  Se ativo, qualquer utilizador registado pode ler. Se inativo, só os membros da Banda e Administradores podem visualizar.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formIsPublic}
                onChange={(e) => setFormIsPublic(e.target.checked)}
                className="h-5 w-5 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddEditDialogOpen(false)}
                className="border-border/60 hover:bg-muted font-bold text-xs py-2 px-4 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-gold text-primary-foreground font-bold shadow-gold text-xs py-2 px-5 cursor-pointer"
              >
                {submitting ? "A Guardar..." : "Gravar Louvor"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* IMPORT HOLYRICS DIALOG */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg w-[95%] bg-card border border-border/80 rounded-3xl p-6 shadow-elevated text-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3 border-b border-border/40">
            <DialogTitle className="text-lg font-bold font-display text-primary flex items-center gap-2">
              <FileText className="h-5 w-5" /> Importar Músicas do Holyrics
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Encontrámos <strong>{importSongsList.length}</strong> música(s) no arquivo. Selecione as que deseja importar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Privacy toggle for imported batch */}
            <div className="p-3.5 bg-muted/40 border border-border/50 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-xs font-bold text-foreground">Definir privacidade da importação</h4>
                <p className="text-[9px] text-muted-foreground leading-relaxed mt-0.5">
                  Importar músicas como públicas (todos lêem) ou privadas (apenas banda).
                </p>
              </div>
              <select
                value={importIsPublic ? "public" : "private"}
                onChange={(e) => {
                  const isPub = e.target.value === "public";
                  setImportIsPublic(isPub);
                  // Update current import list preview state as well
                  setImportSongsList(prev => prev.map(s => ({ ...s, isPublic: isPub })));
                }}
                className="text-xs bg-card border border-border/60 rounded px-2.5 py-1.5 focus:outline-none text-foreground font-semibold"
              >
                <option value="public">Público</option>
                <option value="private">Privado (Banda)</option>
              </select>
            </div>

            {/* List scrollarea with checkboxes */}
            <div className="border border-border/60 rounded-2xl max-h-[35vh] overflow-y-auto divide-y divide-border/40 bg-card/50">
              {importSongsList.map((song, idx) => {
                const isChecked = selectedImportIndexes.includes(idx);
                return (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-foreground truncate">{song.title}</h4>
                      <p className="text-[10px] text-muted-foreground truncate">{song.artist}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setSelectedImportIndexes((prev) =>
                          isChecked ? prev.filter((i) => i !== idx) : [...prev, idx]
                        );
                      }}
                      className="h-4.5 w-4.5 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
                    />
                  </div>
                );
              })}
            </div>
            
            <div className="text-[10px] text-muted-foreground flex justify-between px-1">
              <span>Selecionadas: <strong>{selectedImportIndexes.length}</strong> de <strong>{importSongsList.length}</strong></span>
              <button
                type="button"
                onClick={() => setSelectedImportIndexes(
                  selectedImportIndexes.length === importSongsList.length ? [] : importSongsList.map((_, i) => i)
                )}
                className="text-primary hover:underline font-semibold"
              >
                {selectedImportIndexes.length === importSongsList.length ? "Desmarcar todas" : "Selecionar todas"}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
              className="border-border/60 hover:bg-muted font-bold text-xs py-2 px-4 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmImport}
              disabled={submitting || selectedImportIndexes.length === 0}
              className="bg-gradient-gold text-primary-foreground font-bold shadow-gold text-xs py-2 px-5 cursor-pointer"
            >
              {submitting ? "A Importar..." : `Importar Músicas (${selectedImportIndexes.length})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Progress Bar Overlay */}
      {progressPercent !== null && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-[90%] md:w-80 bg-card/90 backdrop-blur-xl border border-primary/30 rounded-3xl p-5 shadow-elevated animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center gap-4 mb-2">
            <span className="text-xs font-bold text-foreground truncate">{progressLabel}</span>
            <span className="text-xs font-bold text-primary">{progressPercent}%</span>
          </div>
          <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden border border-border/30">
            <div
              className="bg-gradient-gold h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
