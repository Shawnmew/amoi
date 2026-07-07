import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Play, Search, Youtube, Smartphone, Video, Tag, Calendar, User, Film } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ChurchVideo,
  getDynamicVideos,
  getShortEmbedUrl
} from "../lib/dynamicContent";

export const Route = createFileRoute("/cultos")({
  loader: async () => {
    try {
      const videos = await getDynamicVideos();
      return { videos: videos || [] };
    } catch (e) {
      console.warn("Could not load dynamic videos:", e);
      return { videos: [] };
    }
  },
  head: () => ({
    meta: [
      { title: "Cultos Gravados — AMOI" },
      { name: "description", content: "Assiste aos cultos gravados, pregações e momentos de adoração da AMOI." },
      { property: "og:title", content: "Cultos Gravados — AMOI" },
      { property: "og:description", content: "Pregações, louvor e momentos de oração da AMOI." },
    ],
  }),
  component: Cultos,
});

const CATEGORIES = ["Todos", "Pregação", "Louvor", "Vigília", "Especial"] as const;

function Cultos() {
  const { videos } = Route.useLoaderData();
  const cultosList = useMemo(() => {
    return videos || [];
  }, [videos]);

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("Todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Shorts Modal states
  const [shortsModalOpen, setShortsModalOpen] = useState(false);
  const [selectedShort, setSelectedShort] = useState<ChurchVideo | null>(null);

  const longVideos = useMemo(() => {
    return cultosList.filter((v) => v.type === "youtube" || !v.type);
  }, [cultosList]);

  const shortVideos = useMemo(() => {
    return cultosList.filter((v) => v.type === "short");
  }, [cultosList]);

  const filtered = useMemo(() => {
    return longVideos.filter((c) => {
      const matchesCat = cat === "Todos" || c.category === cat;
      const matchesQuery = c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.speaker.toLowerCase().includes(query.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [longVideos, query, cat]);

  const selected = useMemo(() => {
    if (selectedId) {
      const found = longVideos.find((c) => c.id === selectedId);
      if (found) return found;
    }
    return filtered[0] || longVideos[0] || null;
  }, [selectedId, filtered, longVideos]);

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
    } catch {
      return d;
    }
  };

  return (
    <SiteLayout>
      {/* Header */}
      <section className="pt-20 pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex flex-wrap justify-center gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/40 text-primary text-xs uppercase tracking-[0.25em] font-semibold">
              <Youtube className="h-3.5 w-3.5" /> Cultos Gravados
            </span>
            <Button
              onClick={() => {
                setShortsModalOpen(true);
                if (shortVideos.length > 0 && !selectedShort) {
                  setSelectedShort(shortVideos[0]);
                }
              }}
              className="bg-gradient-fire text-secondary-foreground shadow-ember text-xs font-semibold h-[34px] rounded-full uppercase tracking-wider px-4 shrink-0 cursor-pointer"
            >
              <Smartphone className="h-3.5 w-3.5 mr-1.5" /> Clipes / Curtos (TikTok / Reels)
            </Button>
          </div>
          <h1 className="mt-5 text-4xl md:text-6xl font-bold">
            Reviva a presença de <span className="text-gradient-gold">Deus</span>
          </h1>
          <div className="gold-divider w-40 mx-auto my-6" />
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Pregações, momentos de louvor e vigílias gravadas — todos os cultos da AMOI ao teu alcance.
          </p>
        </div>
      </section>

      {/* Featured player */}
      {selected ? (
        <section className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-2xl overflow-hidden border border-primary/30 shadow-elevated bg-card">
              <div className="aspect-video w-full">
                <iframe
                  key={selected.id}
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${selected.youtubeId}`}
                  title={selected.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div>
                  <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">{selected.category}</span>
                  <h2 className="mt-1 text-2xl md:text-3xl font-display font-bold">{selected.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{selected.speaker} · {fmtDate(selected.date)}</p>
                </div>
                <Button asChild variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 self-start md:self-auto">
                  <a href={`https://www.youtube.com/watch?v=${selected.youtubeId}`} target="_blank" rel="noopener noreferrer">
                    <Youtube className="mr-2 h-4 w-4" /> Ver no YouTube
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-16 text-center max-w-xl mx-auto">
          <div className="p-8 bg-card/30 rounded-3xl border border-border/60 shadow-elevated">
            <Video className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Nenhum culto longo disponível.</p>
            <p className="text-xs text-muted-foreground/80 mt-1">Adicione vídeos no painel administrativo.</p>
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Procurar culto ou pregador…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-card border-border/60"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest font-semibold transition-all cursor-pointer ${
                  cat === c
                    ? "bg-gradient-gold text-primary-foreground shadow-gold"
                    : "bg-card border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            longVideos.length > 0 && <p className="text-center text-muted-foreground py-12">Nenhum culto encontrado para os filtros selecionados.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((c) => {
                const isActive = selected && c.id === selected.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedId(c.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`group text-left rounded-2xl overflow-hidden bg-card border transition-all hover:-translate-y-1 cursor-pointer ${
                      isActive ? "border-primary shadow-gold" : "border-border/60 hover:border-primary/40"
                    }`}
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={`https://img.youtube.com/vi/${c.youtubeId}/hqdefault.jpg`}
                        alt={c.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-14 w-14 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-gold transition-transform group-hover:scale-110">
                          <Play className="h-6 w-6 ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                      <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] uppercase tracking-widest rounded-full bg-background/80 backdrop-blur border border-primary/40 text-primary font-semibold">
                        {c.category}
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-lg leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {c.title}
                      </h3>
                      <p className="mt-2 text-xs text-muted-foreground">{c.speaker} · {fmtDate(c.date)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {longVideos.length > 0 && (
            <p className="text-center text-xs text-muted-foreground mt-10 italic">
              * Os vídeos são geridos e atualizados dinamicamente pela liderança da AMOI.
            </p>
          )}

          {/* Modal / Dialog for clips/shorts */}
          <Dialog open={shortsModalOpen} onOpenChange={setShortsModalOpen}>
            <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] md:max-h-[85vh] bg-card/95 border border-primary/20 backdrop-blur-md p-6 rounded-3xl overflow-hidden flex flex-col md:flex-row gap-6 shadow-elevated select-none">
              {/* Left Column: Clips list */}
              <div className="flex-1 overflow-y-auto max-h-[40vh] md:max-h-[75vh] pr-2">
                <DialogHeader className="mb-4">
                  <DialogTitle className="font-display text-xl font-bold text-primary flex items-center gap-2">
                    <Smartphone className="h-5 w-5" /> Clipes & Vídeos Curtos
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Assista a vídeos curtos da AMOI postados no TikTok, Shorts e Reels.
                  </DialogDescription>
                </DialogHeader>

                {shortVideos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">Nenhum vídeo curto disponível no momento.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3 mt-4">
                    {shortVideos.map((s) => {
                      const parsed = getShortEmbedUrl(s.shortUrl || "");
                      const platformName = parsed ? parsed.platform.toUpperCase() : "VÍDEO";
                      const isCurrent = selectedShort?.id === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelectedShort(s)}
                          className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-28 hover:border-primary/45 cursor-pointer ${
                            isCurrent
                              ? "border-primary bg-primary/5 text-primary shadow-gold font-bold"
                              : "border-border/60 bg-card/50 text-muted-foreground"
                          }`}
                        >
                          <span className="font-semibold text-foreground text-sm line-clamp-2 leading-tight">
                            {s.title}
                          </span>
                          <div className="flex items-center justify-between mt-2 w-full text-[10px] uppercase tracking-wider font-semibold">
                            <span className="flex items-center gap-1 text-muted-foreground/80">
                              <User className="h-3 w-3 text-primary" /> {s.speaker}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-secondary text-primary border border-secondary/30">
                              {platformName}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Vertical Player */}
              <div className="w-full md:w-[320px] shrink-0 flex flex-col justify-center items-center bg-black/40 rounded-2xl border border-border/40 p-4 min-h-[380px] md:min-h-0">
                {selectedShort ? (
                  (() => {
                    const parsed = getShortEmbedUrl(selectedShort.shortUrl || "");
                    return parsed ? (
                      <div className="w-full h-full flex flex-col justify-between items-center gap-3">
                        <div className="relative aspect-[9/16] w-full max-w-[240px] bg-black rounded-2xl overflow-hidden border border-primary/20 shadow-elevated">
                          <iframe
                            key={selectedShort.id}
                            className="w-full h-full absolute inset-0"
                            src={parsed.embedUrl}
                            title={selectedShort.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-primary flex items-center justify-center gap-1">
                            <Film className="h-3 w-3" /> Plataforma: {parsed.platform}
                          </span>
                          <p className="text-xs text-foreground font-semibold mt-1 truncate max-w-[200px]" title={selectedShort.title}>
                            {selectedShort.title}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-xs text-muted-foreground p-4">
                        <p>Link inválido ou não suportado para incorporação.</p>
                        <Button asChild size="sm" variant="outline" className="mt-4 w-full text-xs">
                          <a href={selectedShort.shortUrl} target="_blank" rel="noopener noreferrer">
                            Assistir no Navegador
                          </a>
                        </Button>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center text-muted-foreground p-6 flex flex-col items-center gap-3">
                    <Smartphone className="h-8 w-8 text-primary/40 animate-pulse" />
                    <span className="text-xs">Selecione um clip ao lado para assistir</span>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>
    </SiteLayout>
  );
}

