import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, User, Newspaper, Tag, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Announcement,
  getDynamicAnnouncements,
  DEFAULT_ANNOUNCEMENTS,
  convertGoogleDriveLink
} from "../lib/dynamicContent";

export const Route = createFileRoute("/boas-novas")({
  head: () => ({
    meta: [
      { title: "Boas Novas — AMOI" },
      { name: "description", content: "Acompanhe as publicações, notícias, eventos e comunicados oficiais da AMOI." },
      { property: "og:title", content: "Boas Novas — AMOI" },
      { property: "og:description", content: "Fique por dentro de tudo o que acontece na nossa comunidade." },
    ],
  }),
  component: BoasNovas,
});

const CATEGORIES = ["Todos", "Notícia", "Evento", "Aviso"] as const;

function BoasNovas() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("amoi_announcements");
      if (local) {
        try { return JSON.parse(local); } catch {}
      }
    }
    return DEFAULT_ANNOUNCEMENTS;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<(typeof CATEGORIES)[number]>("Todos");
  const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const fetched = await getDynamicAnnouncements();
        setAnnouncements(fetched);
      } catch (e) {
        console.error("Error loading announcements:", e);
      }
    }
    loadAnnouncements();
  }, []);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      const matchesCategory =
        selectedCategory === "Todos" ||
        ann.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ann.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ann.author.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [announcements, searchQuery, selectedCategory]);

  return (
    <SiteLayout>
      {/* Header / Hero Section */}
      <section className="pt-20 pb-12 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/40 text-primary text-xs uppercase tracking-[0.25em] font-semibold">
            <Newspaper className="h-3.5 w-3.5" /> Mural de Publicações
          </span>
          <h1 className="mt-5 text-4xl md:text-6xl font-bold font-display leading-tight">
            Boas <span className="text-gradient-gold">Novas</span>
          </h1>
          <div className="gold-divider w-40 mx-auto my-6" />
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Fique por dentro dos avisos oficiais, relatórios de eventos, notícias da igreja e mensagens inspiradoras da nossa família espiritual.
          </p>
        </div>
      </section>

      {/* Filter and Search Section */}
      <section className="py-6 border-y border-border/40 bg-card/20 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 justify-center">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest font-semibold transition-all border ${
                  selectedCategory === cat
                    ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold"
                    : "bg-card border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40"
                }`}
              >
                {cat === "Todos" ? "Ver Todos" : cat + "s"}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Procurar publicações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card border-border/60 text-sm h-10 w-full"
            />
          </div>
        </div>
      </section>

      {/* Publications Grid */}
      <section className="py-16 min-h-[400px]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-16 bg-card/30 rounded-3xl border border-border/60 max-w-xl mx-auto p-8 shadow-elevated">
              <Newspaper className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Nenhuma publicação encontrada.</p>
              <p className="text-xs text-muted-foreground/80 mt-1">Tente ajustar os filtros ou termo de pesquisa.</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAnnouncements.map((ann) => {
                  return (
                    <article
                      key={ann.id}
                      onClick={() => setSelectedAnn(ann)}
                      className="flex flex-col rounded-3xl bg-card border border-border/60 hover:border-primary/40 hover:scale-[1.01] transition-all duration-300 shadow-elevated overflow-hidden group cursor-pointer"
                    >
                      {/* Image */}
                      {ann.imageUrl && (
                        <div className="aspect-[16/10] w-full overflow-hidden border-b border-border/60 relative">
                          <img
                            src={convertGoogleDriveLink(ann.imageUrl)}
                            alt={ann.title}
                            loading="lazy"
                            className="object-cover w-full h-full group-hover:scale-[1.03] transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 pointer-events-none" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Meta Category & Date */}
                          <div className="flex items-center justify-between mb-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                              <Tag className="h-3 w-3" /> {ann.category}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5 text-primary" /> {ann.date}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="font-display text-xl md:text-2xl font-bold text-foreground leading-snug mb-3 group-hover:text-primary transition-colors duration-300">
                            {ann.title}
                          </h3>

                          {/* Content text */}
                          <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-wrap line-clamp-3">
                            {ann.content}
                          </p>
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-6 pt-5 border-t border-border/60 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <User className="h-3.5 w-3.5 text-primary" /> {ann.author}
                          </span>

                          <span
                            className="text-xs text-primary font-bold flex items-center gap-1 group-hover:underline"
                          >
                            Ler mais
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Premium Dialog for detailed view */}
              <Dialog open={selectedAnn !== null} onOpenChange={(open) => !open && setSelectedAnn(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card/95 border border-primary/20 backdrop-blur-md p-0 rounded-3xl overflow-hidden shadow-elevated select-none">
                  {selectedAnn && (
                    <div className="select-text">
                      {/* Large Image Header */}
                      {selectedAnn.imageUrl && (
                        <div className="w-full relative bg-black/40 flex items-center justify-center border-b border-border/40 overflow-hidden max-h-[480px]">
                          <img
                            src={convertGoogleDriveLink(selectedAnn.imageUrl)}
                            alt={selectedAnn.title}
                            className="max-h-[480px] w-auto h-auto object-contain mx-auto"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                        </div>
                      )}

                      {/* Dialog Content Details */}
                      <div className="p-6 md:p-10">
                        {/* Meta Tags */}
                        <div className="flex items-center gap-4 flex-wrap mb-6 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                            <Tag className="h-3.5 w-3.5" /> {selectedAnn.category}
                          </span>
                          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-primary" /> {selectedAnn.date}</span>
                          <span className="flex items-center gap-1"><User className="h-3.5 w-3.5 text-primary" /> {selectedAnn.author}</span>
                        </div>

                        {/* Title */}
                        <DialogTitle className="font-display text-2xl md:text-4xl font-bold text-foreground leading-tight mb-6">
                          {selectedAnn.title}
                        </DialogTitle>

                        {/* Content Text */}
                        <DialogDescription className="text-muted-foreground leading-relaxed text-sm md:text-base whitespace-pre-wrap font-sans text-left mt-2 block select-text">
                          {selectedAnn.content}
                        </DialogDescription>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
