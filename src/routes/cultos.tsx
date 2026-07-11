import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
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
  const [clientVideos, setClientVideos] = useState<ChurchVideo[]>(() => {
    if (videos && videos.length > 0) return videos;
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("amoi_mock_videos_db");
      if (local) {
        try { return JSON.parse(local); } catch {}
      }
    }
    return [];
  });

  useEffect(() => {
    let active = true;
    getDynamicVideos().then((fetched) => {
      if (active && fetched && fetched.length > 0) {
        setClientVideos(fetched);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const cultosList = useMemo(() => {
    return clientVideos || [];
  }, [clientVideos]);

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("Todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Short Video playing state
  const [playingShortId, setPlayingShortId] = useState<string | null>(null);

  const longVideos = useMemo(() => {
    return cultosList.filter((v) => v.type === "youtube" || !v.type);
  }, [cultosList]);

  const shortVideos = useMemo(() => {
    return cultosList.filter((v) => v.type === "short");
  }, [cultosList]);

  const filtered = useMemo(() => {
    return longVideos.filter((c) => {
      const title = c.title || "";
      const speaker = c.speaker || "";
      const category = c.category || "";
      
      const matchesCat = cat === "Todos" || category === cat;
      const matchesQuery = title.toLowerCase().includes(query.toLowerCase()) ||
        speaker.toLowerCase().includes(query.toLowerCase());
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

  const getCleanYoutubeId = (id?: string) => {
    if (!id) return "";
    return id.split("?")[0].split("&")[0].split("/")[0].trim();
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
                  src={`https://www.youtube.com/embed/${getCleanYoutubeId(selected.youtubeId)}`}
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
                  <a href={`https://www.youtube.com/watch?v=${getCleanYoutubeId(selected.youtubeId)}`} target="_blank" rel="noopener noreferrer">
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

      {/* Short Videos Subsection */}
      {shortVideos.length > 0 && (
        <section className="py-12 border-t border-b border-border/40 bg-card/15 shadow-inner">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4" /> Vídeos Verticais
                </span>
                <h2 className="mt-2 text-2xl md:text-3xl font-bold font-display">Clipes, Shorts & Reels</h2>
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline-block">
                Deslize para o lado para ver mais →
              </span>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
              {shortVideos.map((s) => {
                const parsed = getShortEmbedUrl(s.shortUrl || "");
                const platform = parsed ? parsed.platform : "youtube";
                const isPlaying = playingShortId === s.id;
                
                let ytShortId = "";
                if (platform === "youtube" && s.shortUrl) {
                  ytShortId = getCleanYoutubeId(s.shortUrl);
                }

                return (
                  <div
                    key={s.id}
                    className="w-[240px] shrink-0 group flex flex-col gap-3"
                  >
                    <div className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden border border-primary/20 bg-black/60 shadow-elevated transition-all group-hover:border-primary/45">
                      {isPlaying && parsed ? (
                        <iframe
                          className="absolute inset-0 w-full h-full"
                          src={`${parsed.embedUrl}?autoplay=1`}
                          title={s.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <button
                          onClick={() => setPlayingShortId(s.id)}
                          className="absolute inset-0 w-full h-full flex flex-col justify-between p-4 text-left cursor-pointer"
                        >
                          {/* Top Platform Tag */}
                          <div className="self-end px-2.5 py-1 rounded-full bg-background/80 backdrop-blur border border-primary/30 text-[10px] uppercase font-bold tracking-wider text-primary">
                            {platform}
                          </div>

                          {/* Cover Thumbnail or Platform Background */}
                          {platform === "youtube" && ytShortId ? (
                            <img
                              src={`https://img.youtube.com/vi/${ytShortId}/hqdefault.jpg`}
                              alt={s.title}
                              className="absolute inset-0 w-full h-full object-cover -z-10 brightness-[0.4] transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-card to-background -z-10 flex items-center justify-center">
                              {platform === "tiktok" ? (
                                <Film className="h-12 w-12 text-primary/30 animate-pulse" />
                              ) : (
                                <Film className="h-12 w-12 text-pink-500/30 animate-pulse" />
                              )}
                            </div>
                          )}

                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-12 w-12 rounded-full bg-primary/95 text-primary-foreground flex items-center justify-center shadow-gold transition-transform group-hover:scale-110">
                              <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
                            </div>
                          </div>

                          {/* Gradient Bottom Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent -z-5" />

                          {/* Title & Author Info */}
                          <div className="mt-auto relative z-10">
                            <p className="text-[11px] font-semibold text-primary/90">{s.speaker}</p>
                            <h3 className="text-xs font-bold text-white line-clamp-2 mt-0.5 leading-snug">
                              {s.title}
                            </h3>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
                        src={`https://img.youtube.com/vi/${getCleanYoutubeId(c.youtubeId)}/hqdefault.jpg`}
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
        </div>
      </section>
    </SiteLayout>
  );
}

