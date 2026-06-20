import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Flame, Quote } from "lucide-react";
import leader1 from "@/assets/leader-1.jpg";
import leader2 from "@/assets/leader-2.jpg";
import leader3 from "@/assets/leader-3.jpg";
import leader4 from "@/assets/leader-4.jpg";
import preaching from "@/assets/hero-preaching.jpg";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre a AMOI — A Nossa História e Liderança" },
      { name: "description", content: "Conheça a história da Associação Ministério de Oração e Intercessão, os seus valores, pastores e líderes." },
      { property: "og:title", content: "Sobre a AMOI" },
      { property: "og:description", content: "A história, missão e liderança dos Bravos Guerreiros da Fé." },
    ],
  }),
  component: Sobre,
});

const LEADERS = [
  { name: "Pastor Principal", role: "Pastor Sénior & Fundador", img: leader1, bio: "Líder visionário da AMOI desde a sua fundação, com mais de duas décadas dedicadas ao ministério pastoral." },
  { name: "Pastora", role: "Liderança Feminina & Intercessão", img: leader2, bio: "Conduz o ministério de mulheres e a frente de intercessão da igreja com profunda unção." },
  { name: "Líder de Louvor", role: "Ministério de Música", img: leader3, bio: "Responsável pelo ministério de adoração, conduzindo a igreja diante do trono de Deus." },
  { name: "Líder de Ensino", role: "Discipulado & Palavra", img: leader4, bio: "Coordena as classes bíblicas, formação de discípulos e ensino sistemático." },
];

const TIMELINE = [
  { year: "Início", title: "O Chamado", desc: "Tudo começou com um pequeno grupo de oração, reunido com fome da presença de Deus." },
  { year: "Crescimento", title: "Formação da Igreja", desc: "O grupo cresceu e tornou-se uma comunidade local, oficialmente organizada como AMOI." },
  { year: "Expansão", title: "Bravos Guerreiros da Fé", desc: "A visão expandiu-se para formar guerreiros espirituais firmes na Palavra e na oração." },
  { year: "Hoje", title: "Uma Família que Arde", desc: "Centenas de vidas tocadas, gerações sendo levantadas para o serviço do Reino." },
];

function Sobre() {
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{ background: "var(--gradient-radial-gold)" }} />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/40 text-primary text-xs uppercase tracking-[0.25em] font-semibold">
            <Flame className="h-3.5 w-3.5" /> Sobre nós
          </span>
          <h1 className="mt-5 text-4xl md:text-6xl font-bold">
            A história dos <span className="text-gradient-gold">Bravos Guerreiros da Fé</span>
          </h1>
          <div className="gold-divider w-40 mx-auto my-6" />
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A AMOI — Associação Ministério de Oração e Intercessão — nasceu de um clamor profundo:
            o desejo de ver vidas verdadeiramente transformadas pelo poder da oração e da Palavra de Deus.
          </p>
        </div>
      </section>

      {/* History */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-5 gap-12 items-start">
          <div className="lg:col-span-2 lg:sticky lg:top-28">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-gold opacity-20 blur-3xl rounded-full" />
              <img src={preaching} alt="Pregação na AMOI" className="relative rounded-2xl shadow-elevated border border-primary/20" loading="lazy" />
            </div>
            <figure className="mt-8 p-6 rounded-2xl bg-card border border-primary/20">
              <Quote className="h-7 w-7 text-primary" />
              <blockquote className="mt-3 font-display text-lg italic text-foreground leading-relaxed">
                "Edificai-vos a vós mesmos sobre a vossa santíssima fé, orando no Espírito Santo."
              </blockquote>
              <figcaption className="mt-3 text-sm text-muted-foreground">— Judas 1:20</figcaption>
            </figure>
          </div>

          <div className="lg:col-span-3">
            <h2 className="text-3xl md:text-4xl font-bold">A nossa caminhada</h2>
            <div className="gold-divider w-24 my-5" />
            <p className="text-muted-foreground leading-relaxed text-lg">
              A AMOI surgiu da convicção de que a oração é a chave do avivamento. Aquilo que começou
              como pequenas reuniões de intercessão tornou-se uma comunidade vibrante, comprometida
              em formar discípulos firmes, intercessores ardentes e adoradores autênticos.
            </p>

            <div className="mt-12 relative pl-8">
              <div className="absolute left-0 top-2 bottom-2 w-px bg-gradient-to-b from-primary via-secondary to-transparent" />
              {TIMELINE.map((t) => (
                <div key={t.title} className="relative mb-10 last:mb-0">
                  <div className="absolute -left-[34px] top-1 h-4 w-4 rounded-full bg-gradient-gold shadow-gold ring-4 ring-background" />
                  <div className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">{t.year}</div>
                  <h3 className="font-display text-2xl mt-1 text-foreground">{t.title}</h3>
                  <p className="mt-2 text-muted-foreground leading-relaxed">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission / Vision / Values */}
      <section className="py-20 border-y border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-6">
          {[
            { title: "Missão", text: "Levar o evangelho do Reino através da oração, ensino e adoração, formando discípulos comprometidos com Cristo." },
            { title: "Visão", text: "Ser uma comunidade de referência em oração e intercessão, levantando guerreiros espirituais para cada geração." },
            { title: "Valores", text: "Fé inabalável · Oração contínua · Palavra sólida · Adoração genuína · Família e comunhão." },
          ].map((b) => (
            <div key={b.title} className="p-8 rounded-2xl bg-card border border-border/60 hover:border-primary/50 transition-all">
              <div className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">{b.title}</div>
              <div className="gold-divider w-12 my-4" />
              <p className="text-foreground/90 leading-relaxed">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Leadership */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">Liderança</span>
            <h2 className="mt-3 text-4xl md:text-5xl font-bold">Pastores & <span className="text-gradient-gold">Líderes</span></h2>
            <div className="gold-divider w-32 mx-auto my-5" />
            <p className="text-muted-foreground">
              Servos dedicados a apascentar o rebanho do Senhor com amor, sabedoria e ousadia.
            </p>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {LEADERS.map((p) => (
              <article key={p.name} className="group relative rounded-2xl overflow-hidden bg-card border border-border/60 hover:border-primary/50 transition-all hover:-translate-y-1 shadow-elevated">
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={p.img}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-card via-card/95 to-transparent pt-16">
                  <h3 className="font-display text-xl text-foreground">{p.name}</h3>
                  <div className="text-xs uppercase tracking-widest text-primary mt-1 font-semibold">{p.role}</div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">{p.bio}</p>
                </div>
              </article>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-10 italic">
            Os nomes e fotos exibidos são marcadores — substitua pelos dados reais da liderança da AMOI.
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
