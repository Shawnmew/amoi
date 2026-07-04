import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Award, Heart, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";

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

type Servant = {
  name: string;
  role: string;
  dept: string;
  bio: string;
  img?: string;
};

const DEPARTMENTS = [
  "Todos",
  "Departamento das Crianças",
  "Departamento dos Jovens",
  "Departamento de Comunicação e Imagem",
  "Departamento Administrativo",
  "Secretaria",
  "Ação Social",
  "Departamento das Mulheres",
  "Departamento dos Homens",
] as const;

const SERVANTS: Servant[] = [
  // Departamento das Crianças
  { name: "Anciã Sandra Congo", role: "Coordenadora do Ministério Infantil", dept: "Departamento das Crianças", bio: "Guia as crianças nos primeiros passos da fé com amor, ensino bíblico e paciência." },
  { name: "Irmã Teresa Francisco", role: "Educadora Infantil", dept: "Departamento das Crianças", bio: "Auxilia no ensino bíblico criativo e no cuidado diário das crianças nos cultos." },

  // Departamento dos Jovens
  { name: "Pastor Tiago Congo", role: "Coordenador Geral dos Jovens", dept: "Departamento dos Jovens", bio: "Lidera a juventude com dinamismo, focando no despertamento espiritual e santidade." },
  { name: "Irmão Mateus Manuel", role: "Líder de Jovens", dept: "Departamento dos Jovens", bio: "Ajuda no discipulado de jovens e na organização dos encontros semanais." },

  // Departamento de Comunicação e Imagem
  { name: "Irmão Lucas Simão", role: "Multimédia & Som", dept: "Departamento de Comunicação e Imagem", bio: "Responsável pela qualidade técnica das transmissões e som da igreja." },
  { name: "Irmã Rebeca António", role: "Fotografia & Redes Sociais", dept: "Departamento de Comunicação e Imagem", bio: "Regista e partilha os testemunhos e eventos da AMOI com dedicação." },

  // Departamento Administrativo
  { name: "Pastor Nicolau CastelBranco", role: "Conselheiro Administrativo", img: leader6, dept: "Departamento Administrativo", bio: "Apoia o conselho da igreja no planeamento estratégico e estabilidade institucional." },
  { name: "Pastor Nelson Nunes", role: "Conselheiro Geral", img: leader1, dept: "Departamento Administrativo", bio: "Acompanha os projetos de expansão física e administrativa do ministério." },

  // Secretaria
  { name: "Diaconisa Judith Fernandes", role: "Secretária Geral", img: leader8, dept: "Secretaria", bio: "Garante a organização administrativa e a comunicação oficial com os membros." },
  { name: "Irmã Neusa João", role: "Auxiliar de Secretaria", dept: "Secretaria", bio: "Auxilia no registo de membros, atas e agendamentos pastorais." },

  // Ação Social
  { name: "Anciã Rosalina Canjila", role: "Coordenadora de Ação Social", img: leader7, dept: "Ação Social", bio: "Lidera os projetos de apoio às famílias carenciadas e visitas de amparo." },
  { name: "Diaconisa Judith Fernandes", role: "Apoio a Ação Social", img: leader8, dept: "Ação Social", bio: "Garante o controle e a distribuição das doações entregues à igreja." },

  // Departamento das Mulheres
  { name: "Anciã Isabel Nunes", role: "Coordenadora do Círculo de Oração", img: leader2, dept: "Departamento das Mulheres", bio: "Lidera as reuniões de oração, aconselhamento e edificação das mulheres." },
  { name: "Anciã Sandra Congo", role: "Apoio ao Ministério de Mulheres", dept: "Departamento das Mulheres", bio: "Trabalha no fortalecimento espiritual e no apoio mútuo entre as irmãs." },

  // Departamento dos Homens
  { name: "Pastor Nelson Nunes", role: "Conselheiro dos Varões", img: leader1, dept: "Departamento dos Homens", bio: "Ministra a Palavra aos homens, focando no papel do homem segundo o coração de Deus." },
  { name: "Pastor Tiago Congo", role: "Líder dos Varões", dept: "Departamento dos Homens", bio: "Organiza as vigílias e encontros de edificação masculina na igreja." }
];

function OChamado() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("Todos");

  const filteredServants = useMemo(() => {
    return SERVANTS.filter((s) => {
      const matchesCat = cat === "Todos" || s.dept === cat;
      const matchesQuery = s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.role.toLowerCase().includes(query.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [query, cat]);

  const initials = (name: string) => name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

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
              {filteredServants.map((s, index) => (
                <article
                  key={`${s.name}-${s.dept}-${index}`}
                  className="group relative rounded-2xl overflow-hidden bg-card border border-border/60 hover:border-primary/50 transition-all hover:-translate-y-1 shadow-elevated"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-muted">
                    {s.img ? (
                      <img
                        src={s.img}
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
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
