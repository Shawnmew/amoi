import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Play, Search, Youtube } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cultos")({
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

type Culto = {
  id: string;
  title: string;
  speaker: string;
  date: string;
  category: "Pregação" | "Louvor" | "Vigília" | "Especial";
  youtubeId: string;
};

// Placeholder YouTube IDs — substituir pelos cultos reais do canal @ministerioamoi
const CULTOS: Culto[] = [
  { id: "1", title: "O Poder da Oração Persistente", speaker: "Pastor Nelson Nunes", date: "2026-06-15", category: "Pregação", youtubeId: "9K_BRUFp8qg?si=dqN2RVeyss7mLb63" },
  { id: "2", title: "Vigília — Quebrando Barreiras", speaker: "Equipa de Intercessão", date: "2026-06-13", category: "Vigília", youtubeId: "dQw4w9WgXcQ" },
  { id: "3", title: "Louvor ao Trono — Ao Vivo", speaker: "Ministério de Louvor", date: "2026-06-08", category: "Louvor", youtubeId: "dQw4w9WgXcQ" },
  { id: "4", title: "A Fé que Move Montanhas", speaker: "Pastor Nelson Nunes", date: "2026-06-01", category: "Pregação", youtubeId: "dQw4w9WgXcQ" },
  { id: "5", title: "Culto de Acção de Graças", speaker: "Anciã Isabel Nunes", date: "2026-05-25", category: "Especial", youtubeId: "dQw4w9WgXcQ" },
  { id: "6", title: "Bravos Guerreiros da Fé", speaker: "Pastor Nelson Nunes", date: "2026-05-18", category: "Pregação", youtubeId: "dQw4w9WgXcQ" },
  { id: "7", title: "Encontro de Jovens — Arde", speaker: "Líder de Jovens", date: "2026-05-11", category: "Especial", youtubeId: "dQw4w9WgXcQ" },
  { id: "8", title: "Adoração Profética", speaker: "Ministério de Louvor", date: "2026-05-04", category: "Louvor", youtubeId: "dQw4w9WgXcQ" },
  { id: "9", title: "A Palavra que Cura", speaker: "Pastor Nelson Nunes", date: "2026-04-27", category: "Pregação", youtubeId: "dQw4w9WgXcQ" },
];

const CATEGORIES = ["Todos", "Pregação", "Louvor", "Vigília", "Especial"] as const;

function Cultos() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("Todos");
  const [selected, setSelected] = useState<Culto>(CULTOS[0]);

  const filtered = useMemo(() => {
    return CULTOS.filter((c) => {
      const matchesCat = cat === "Todos" || c.category === cat;
      const matchesQuery = c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.speaker.toLowerCase().includes(query.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [query, cat]);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <SiteLayout>
      {/* Header */}
      <section className="pt-20 pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/40 text-primary text-xs uppercase tracking-[0.25em] font-semibold">
            <Youtube className="h-3.5 w-3.5" /> Cultos Gravados
          </span>
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
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest font-semibold transition-all ${
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
            <p className="text-center text-muted-foreground py-12">Nenhum culto encontrado.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((c) => {
                const isActive = c.id === selected.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelected(c);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`group text-left rounded-2xl overflow-hidden bg-card border transition-all hover:-translate-y-1 ${
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

          <p className="text-center text-xs text-muted-foreground mt-10 italic">
            * Os vídeos exibidos são marcadores. Substitua os IDs do YouTube pelos cultos reais do canal @ministerioamoi.
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
