import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Award, Search, Users, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  ChurchServant,
  getDynamicServants,
  DEFAULT_SERVANTS,
  convertGoogleDriveLink
} from "../lib/dynamicContent";

import leader1 from "@/assets/pastor-nelson.jpg";
import leader2 from "@/assets/ancia-isabel.jpg";
import leader3 from "@/assets/profeta-edgar.jpg";
import leader4 from "@/assets/profetiza-maria.jpg";
import leader5 from "@/assets/serva-elizabeth.jpg";
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
  "Os Bravos Guerreiros da Fé",
  "Departamento Administrativo",
  "Secretaria",
  "Departamento das Crianças",
  "Departamento dos Jovens",
  "Ação Social",
  "Departamento de Comunicação e Imagem",
  "Departamento do Protocolo",
  "Departamento de Louvor",
  "Banda AMOI",
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
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const groupedServants = useMemo(() => {
    const filtered = servants.filter((s) => {
      const sName = s.name || "";
      const sRole = s.role || "";
      const sDept = s.dept || "";
      
      const matchesCat = cat === "Todos" || sDept === cat;
      const matchesQuery = sName.toLowerCase().includes(query.toLowerCase()) ||
        sRole.toLowerCase().includes(query.toLowerCase());
      return matchesCat && matchesQuery;
    });

    const order = DEPARTMENTS.filter(d => d !== "Todos");
    const groups: Record<string, ChurchServant[]> = {};
    order.forEach(d => { groups[d] = []; });

    filtered.forEach(s => {
      const sDept = s.dept || "Outros";
      if (!groups[sDept]) {
        groups[sDept] = [];
      }
      groups[sDept].push(s);
    });

    return order
      .map(dept => {
        const deptList = groups[dept] || [];
        const sortedDeptList = [...deptList].sort((a, b) => {
          const orderA = a.order !== undefined ? a.order : 999;
          const orderB = b.order !== undefined ? b.order : 999;
          if (orderA !== orderB) return orderA - orderB;
          const nameA = a.name || "";
          const nameB = b.name || "";
          return nameA.localeCompare(nameB);
        });
        return { dept, servants: sortedDeptList };
      })
      .filter(g => g.servants.length > 0);
  }, [servants, query, cat]);

  const totalCount = useMemo(() => {
    return groupedServants.reduce((sum, g) => sum + g.servants.length, 0);
  }, [groupedServants]);

  const initials = (name?: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .filter(Boolean)
      .map(n => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getServantImage = (s: ChurchServant) => {
    if (s.img) {
      if (s.img.startsWith("http")) {
        return convertGoogleDriveLink(s.img);
      }
      if (s.img === "pastor-nelson") return leader1;
      if (s.img === "ancia-isabel") return leader2;
      if (s.img === "profeta-edgar") return leader3;
      if (s.img === "ancia-maria-julia") return leader4;
      if (s.img === "serva-elizabeth") return leader5;
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Procurar servo ou cargo…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 bg-card border-border/60"
              />
            </div>

            {/* Dropdown Filter */}
            <div className="relative w-full sm:max-w-xs">
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                className="w-full appearance-none rounded-xl border border-border/60 bg-card px-4 py-2.5 pr-10 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary/50 shadow-elevated cursor-pointer transition-all hover:border-primary/30"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d} className="bg-card">
                    {d === "Todos" ? "Todos os Departamentos" : d}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {totalCount === 0 ? (
            <div className="text-center py-20 bg-card/30 rounded-2xl border border-border/60">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Nenhum servo encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">Experimenta mudar o termo de pesquisa ou o filtro.</p>
            </div>
          ) : (
            <div className="space-y-16">
              {groupedServants.map((group) => (
                <div key={group.dept} className="space-y-6">
                  {/* Subsection Header */}
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary shadow-gold" />
                    <h2 className="text-2xl font-bold font-display text-foreground tracking-wide">{group.dept}</h2>
                    <div className="flex-1 h-[1px] bg-gradient-to-r from-border/60 via-border/20 to-transparent ml-4" />
                  </div>

                  {/* Servants Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {group.servants.map((s) => {
                      const servantImg = getServantImage(s);
                      const isBroken = brokenImages[s.id];
                      const showFallback = !servantImg || isBroken;
                      return (
                        <article
                          key={s.id}
                          className="group relative rounded-2xl overflow-hidden bg-card border border-border/60 hover:border-primary/50 transition-all hover:-translate-y-1 shadow-elevated"
                        >
                          <div className="aspect-[4/5] overflow-hidden bg-muted">
                            {!showFallback ? (
                              <img
                                src={servantImg}
                                alt={s.name}
                                onError={() => {
                                  setBrokenImages(prev => ({ ...prev, [s.id]: true }));
                                }}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-card via-secondary/40 to-primary/20 flex items-center justify-center border border-primary/20 transition-transform duration-500 group-hover:scale-105">
                                <span className="font-display text-2xl sm:text-3xl font-bold text-gradient-gold tracking-widest">
                                  {initials(s.name)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5 bg-gradient-to-t from-card via-card/95 to-transparent pt-12 sm:pt-16">
                            <h3 className="font-display text-sm sm:text-lg text-foreground leading-snug line-clamp-1 sm:line-clamp-2">{s.name || "Sem Nome"}</h3>
                            <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-primary mt-0.5 sm:mt-1 font-bold truncate">
                              {s.role || "Servo de Deus"}
                            </div>
                            <div className="text-[8px] sm:text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5 truncate">
                              {s.dept || "Geral"}
                            </div>
                            <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-3">
                              {s.bio || ""}
                            </p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
