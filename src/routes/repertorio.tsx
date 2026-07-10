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
  FileText
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

export const Route = createFileRoute("/repertorio")({
  head: () => ({
    meta: [
      { title: "Repertório de Louvor — AMOI" },
      { name: "description", content: "Repertório oficial de louvores e letras cantadas na AMOI." },
    ],
  }),
  component: Repertoire,
});

function Repertoire() {
  const { user, loading } = useAuth();

  // Repertoire state
  const [songs, setSongs] = useState<RepertoireSong[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
    let successCount = 0;
    const importedSongs: RepertoireSong[] = [];

    try {
      for (const idx of selectedImportIndexes) {
        const song = importSongsList[idx];
        song.isPublic = importIsPublic;
        await saveDynamicRepertoireSong(song);
        importedSongs.push(song);
        successCount++;
      }

      setSongs((prev) => [...importedSongs, ...prev]);
      toast.success(`${successCount} música(s) importada(s) com sucesso!`);
      setImportDialogOpen(false);
    } catch (err) {
      console.error("Error during import:", err);
      toast.error("Erro ao importar algumas músicas.");
    } finally {
      setSubmitting(false);
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

        {/* Search Bar */}
        <div className="relative max-w-md w-full mb-8">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por título, artista ou letra..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border/60"
          />
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
                  onClick={() => setSelectedSong(song)}
                  className="p-6 rounded-3xl bg-card/40 border border-border/60 hover:border-primary/50 hover:bg-card/70 transition-all cursor-pointer flex flex-col justify-between shadow-elevated relative group"
                >
                  <div>
                    {/* Privacy badge and indicators */}
                    <div className="flex justify-between items-center gap-2 mb-3">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        {song.artist}
                      </span>
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

            <div className="flex justify-between gap-3 pt-3 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleCopyLyrics(selectedSong)}
                className="border-border/60 hover:bg-muted font-semibold text-xs py-2 px-3 cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5 mr-2" /> Copiar Letra
              </Button>

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
    </SiteLayout>
  );
}
