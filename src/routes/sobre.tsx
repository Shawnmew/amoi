import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Flame, Quote } from "lucide-react";
import leader1 from "@/assets/pastor-nelson.jpg";
import leader2 from "@/assets/ancia-isabel.jpg";
import leader3 from "@/assets/profeta-edgar.jpg";
import leader4 from "@/assets/profetiza-maria.jpg";
import leader5 from "@/assets/serva-elizabeth.jpg";
import leader7 from "@/assets/ancia-rosalina.jpg";
import leader8 from "@/assets/diaconisa-judith.jpg";
import preaching from "@/assets/caminhada.jpg";

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
  { name: "Serva Elizabeth CastelBranco", role: "Líder & Visionária da AMOI", img: leader5, bio: "Esposa do Pastor Nicolau CastelBranco, é a líder e visionária fundadora da AMOI, guiando o ministério com sabedoria, oração e direção divina." },
  { name: "Pastor Nelson Nunes", role: "Pastor", img: leader1, bio: "Pastor dedicado ao ministério na AMOI, focado no ensino da Palavra e no cuidado espiritual da igreja." },
  { name: "Anciã Isabel Nunes", role: "Anciã", img: leader2, bio: "Esposa do Pastor Nelson Nunes, é uma anciã dedicada à intercessão, apoio espiritual e ao fortalecimento das famílias na igreja." },
  { name: "Profeta Edgar Marcolino", role: "Profeta", img: leader3, bio: "Ministério profético da AMOI, atuando no despertamento espiritual e na revelação da palavra de Deus." },
  { name: "Anciã Maria Júlia Marcolino", role: "Anciã", img: leader4, bio: "Esposa do Profeta Edgar Marcolino, atua como anciã com dedicação, oração e aconselhamento." },
  { name: "Anciã Rosalina Canjila", role: "Anciã", img: leader7, bio: "Consagrada anciã da AMOI, atua com dedicação e coração disponível para Deus nas reuniões de aconselhamento e oração." },
  { name: "Diaconisa Judith Fernandes", role: "Diaconisa", img: leader8, bio: "Diaconisa da AMOI, dedicada ao serviço da casa do Senhor com alegria, zelo e apoio constante a todos os membros." },
];

const TIMELINE = [
  {
    year: "2011",
    title: "O Chamado na Inglaterra",
    desc: "A Serva Elizabeth CastelBranco recebe a revelação divina por meio da Sister Mucha na Inglaterra de que o seu chamado espiritual deveria ser estabelecido em Luanda, Angola, para restaurar famílias através da oração e intercessão.",
  },
  {
    year: "2012 / 2013",
    title: "Chegada a Luanda e Primeiros Passos",
    desc: "A Serva Elizabeth CastelBranco e Sister Mucha iniciam o grupo de oração em Luanda de forma muito simples. Irmãs como Neusa João integram-se ao propósito inicial desde cedo.",
  },
  {
    year: "Crescimento",
    title: "Reuniões em Casa da Anciã Isabel",
    desc: "As orações passam a ser realizadas aos sábados na residência da Anciã Isabel Nunes. O Pastor Nelson Nunes é impactado pelo Espírito Santo e junta-se ao grupo, fortalecendo a oração pelas famílias.",
  },
  {
    year: "Expansão",
    title: "Conferências de Oração e Batismo",
    desc: "O ministério cresce com conferências na Cefojor, IMEL e Rádio LAC. O Profeta Edgar Marcolino e a Anciã Maria Júlia Marcolino unem-se à obra. Mais tarde, os casais e irmãos são batizados juntos.",
  },
  {
    year: "Missão",
    title: "Auxílio e Avivamento no Palanca",
    desc: "O ministério apoia outras igrejas locais, como a do Palanca (que cresceu de 2 para mais de 40 membros) e a Alvorada. É celebrado o primeiro casamento do ministério (Paula Congo e Sanito).",
  },
  {
    year: "2019",
    title: "Consagração do Templo no Zango",
    desc: "O ministério estabelece-se no Zango. Em 2019, com a visita da Sister Mucha, o templo é consagrado como consultório de oração e são ungidos formalmente os pastores, profeta e anciãs.",
  },
  {
    year: "Consolidação",
    title: "O Nascimento da AMOI",
    desc: "A adoração prossegue sob condições humildes de lonas e blocos. Com o crescimento e a sugestão do Pastor Nicolau CastelBranco, a obra evolui de consultório para igreja, fundando oficialmente a AMOI.",
  },
  {
    year: "Hoje",
    title: "Templo Estruturado e Crescimento",
    desc: "Com um templo confortável e estruturado, o ministério continua a restaurar casamentos e famílias. Novas lideranças, como a Anciã Rosalina Canjila, são consagradas para continuar a expansão do Reino em Angola.",
  },
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
              <img src={preaching} alt="Culto e oração na AMOI" className="relative rounded-2xl shadow-elevated border border-primary/20" loading="lazy" />
            </div>
            <figure className="mt-8 p-6 rounded-2xl bg-card border border-primary/20">
              <Quote className="h-7 w-7 text-primary" />
              <blockquote className="mt-3 font-display text-sm md:text-base italic text-foreground leading-relaxed">
                "O Espírito do Senhor DEUS está sobre mim, porque o SENHOR tem me ungido para pregar boas novas ao pobre. Ele tem me enviado para atar as feridas do dilacerado, para proclamar liberdade aos cativos e a abertura da prisão para aqueles que estão encarcerados; para proclamar o ano aceitável do SENHOR, e o dia da vingança do nosso Deus, para confortar todos que pranteiam; para nomear aqueles que pranteiam em Sião, para dar-lhes beleza em lugar de cinzas, o óleo de alegria em lugar de pranto, a veste de louvor em lugar de espírito de opressão..."
              </blockquote>
              <figcaption className="mt-3 text-sm text-muted-foreground">— Isaías 61:1-3 BKJ</figcaption>
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
            { title: "Missão", text: "Somos conhecidos como o Ministério de Oração e Intercessão Nacionalmente e Internacionalmente. A nossa missão é de capacitar as pessoas de Deus através da oração, estudo da Palavra e aceitando Jesus Cristo como nosso Senhor e Salvador. Permitir que o Espírito Santo encha nossos corações e revelar coisas mais profundas em libertação e transformação. Nós prosperamos para ensinar e compartilhar a Palavra de Deus com amor e manifestação do Seu Poder." },
            { title: "Visão", text: "Nossa visão é levar o conhecimento da Palavra de Deus com poder aos quebrantados de coração, através da Oração e da Intercessão. Isaías 61:1-3." },
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
            <h2 className="mt-3 text-4xl md:text-5xl font-bold">Bravos Guerreiros <span className="text-gradient-gold">da Fé</span></h2>
            <div className="gold-divider w-32 mx-auto my-5" />
            <p className="text-muted-foreground">
              O grupo de liderança da AMOI, composto por pastores, profetas e servos dedicados a guiar o povo de Deus com amor e sabedoria.
            </p>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
        </div>
      </section>
    </SiteLayout>
  );
}
