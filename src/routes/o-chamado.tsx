import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Award, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  ChurchServant,
  getDynamicServants,
  DEFAULT_SERVANTS,
  convertGoogleDriveLink
} from "../lib/dynamicContent";

import leader1 from "@/assets/pastor-nelson.jpg";
import leader2 from "@/assets/ancia-isabel.jpg";
import leader6 from "@/assets/pastor-nicolau.jpg";
import leader7 from "@/assets/ancia-rosalina.jpg";
import leader8 from "@/assets/diaconisa-judith.jpg";

export const Route = createFileRoute("/o-chamado")({
  head: () => ({
    meta: [
      { title: "O Chamado — Servos e Departamentos da AMOI" },
      { name: "description", content: "Conheça os servos e voluntários da AMOI estruturados pelos diferentes departamentos do ministério." },
      { property: "og:title", content: "O Chamado — Servos e Departamentos da AMOI" },
      { property: "og:description", content: "Conheça a equipa e voluntários dedicados à obra de Deus na AMOI." },
    ],
  }),
  component: OChamado,
});

const DEPARTMENTS = [
  "Todos",
  "Departamento das Crianças",
  "Departamento dos Jovens",
  "Departamento Administrativo",
  "Secretaria",
  "Ação Social",
  "Departamento das Mulheres",
  "Departamento dos Homens",
] as const;

function OChamado() {
  const [servants, setServants] = useState<ChurchServant[]>(() => {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("amoi_servants");
      if (local) {
        try { return JSON.parse(local); } catch {}
      }
    }
    return DEFAULT_SERVANTS;
  });

  useEffect(() => {
    let active = true;
    getDynamicServants().then((fetched) => {
      if (active && fetched && fetched.length > 0) {
        setServants(fetched);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("Todos");

  const filteredServants = useMemo(() => {
    return servants.filter((s) => {
      const matchesCat = cat === "Todos" || s.dept === cat;
      const matchesQuery = s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.role.toLowerCase().includes(query.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [servants, query, cat]);

  const initials = (name: string) => name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  const getServantImage = (s: ChurchServant) => {
    if (s.img) {
      if (s.img.startsWith("http")) {
        return convertGoogleDriveLink(s.img);
      }
      if (s.img === "pastor-nelson") return leader1;
      if (s.img === "ancia-isabel") return leader2;
      if (s.img === "pastor-nicolau") return leader6;
      if (s.img === "ancia-rosalina") return leader7;
      if (s.img === "diaconisa-judith") return leader8;
      return s.img;
    }
    return undefined;
  };

  return (
    <SiteLayout>
      {/* Header */}
      <section className="pt-20 pb-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-radial-gold)" }} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/40 text-primary text-xs uppercase tracking-[0.25em] font-semibold">
            <Users className="h-3.5 w-3.5" /> O Chamado Ministerial
          </span>
          <h1 className="mt-5 text-4xl md:text-6xl font-bold">
            Servindo com <span className="text-gradient-gold">Amor e Fé</span>
          </h1>
          <div className="gold-divider w-40 mx-auto my-6" />
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            "Servi uns aos outros pelo amor." — Gálatas 5:13. Conheça a equipa de voluntários e servos dedicados aos diferentes departamentos na AMOI.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Procurar servo ou cargo…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-card border-border/60"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {DEPARTMENTS.map((d) => (
              <button
                key={d}
                onClick={() => setCat(d)}
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest font-semibold transition-all ${
                  cat === d
                    ? "bg-gradient-gold text-primary-foreground shadow-gold"
                    : "bg-card border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filteredServants.length === 0 ? (
            <div className="text-center py-20 bg-card/30 rounded-2xl border border-border/60">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Nenhum servo encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">Experimenta mudar o termo de pesquisa ou o filtro.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredServants.map((s) => {
                const servantImg = getServantImage(s);
                return (
                  <article
                    key={s.id}
                    className="group relative rounded-2xl overflow-hidden bg-card border border-border/60 hover:border-primary/50 transition-all hover:-translate-y-1 shadow-elevated"
                  >
                    <div className="aspect-[4/5] overflow-hidden bg-muted">
                      {servantImg ? (
                        <img
                          src={servantImg}
                          alt={s.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-card via-secondary/40 to-primary/20 flex items-center justify-center border border-primary/20 transition-transform duration-500 group-hover:scale-105">
                          <span className="font-display text-3xl font-bold text-gradient-gold tracking-widest">
                            {initials(s.name)}
                          </span>
                        </div>
                      )}
                    </div>
                  <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-card via-card/95 to-transparent pt-16">
                    <h3 className="font-display text-xl text-foreground leading-snug">{s.name}</h3>
                    <div className="text-[10px] uppercase tracking-widest text-primary mt-1 font-bold">
                      {s.role}
                    </div>
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">
                      {s.dept}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {s.bio}
                    </p>
                  </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
