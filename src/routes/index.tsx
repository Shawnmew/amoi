import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/SiteLayout";
import { ArrowRight, Calendar, Flame, HandHeart, Users, BookOpenText, User, Bell, Tag, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CarouselSlide,
  Announcement,
  ChurchInfo,
  getDynamicSlides,
  getDynamicInfo,
  getDynamicAnnouncements,
  DEFAULT_SLIDES,
  DEFAULT_INFO,
  DEFAULT_ANNOUNCEMENTS,
  convertGoogleDriveLink
} from "../lib/dynamicContent";
import { useAuth } from "../hooks/useAuth";
import worship from "@/assets/hero-worship.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AMOI — Associação Ministério de Oração e Intercessão" },
      { name: "description", content: "Bem-vindo à AMOI — uma comunidade ardente de fé, oração e adoração. Cultos, ensino e vida em comunidade." },
      { property: "og:title", content: "AMOI — Bravos Guerreiros da Fé" },
      { property: "og:description", content: "Comunidade de oração, intercessão e adoração ao Deus Altíssimo." },
    ],
  }),
  component: Home,
});

function Home() {
  const { user } = useAuth();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);

  // Dynamic Content states initialized with cached values for instant render on refresh
  const [slides, setSlides] = useState<CarouselSlide[]>(() => {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("amoi_carousel_slides");
      if (local) {
        try { return JSON.parse(local); } catch {}
      }
    }
    return DEFAULT_SLIDES;
  });

  const [info, setInfo] = useState<ChurchInfo>(() => {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("amoi_church_info");
      if (local) {
        try { return JSON.parse(local); } catch {}
      }
    }
    return DEFAULT_INFO;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("amoi_announcements");
      if (local) {
        try { return JSON.parse(local); } catch {}
      }
    }
    return DEFAULT_ANNOUNCEMENTS;
  });

  useEffect(() => {
    async function loadData() {
      try {
        const fetchedSlides = await getDynamicSlides();
        const fetchedInfo = await getDynamicInfo();
        const fetchedAnns = await getDynamicAnnouncements();
        setSlides(fetchedSlides);
        setInfo(fetchedInfo);
        setAnnouncements(fetchedAnns);
      } catch (e) {
        console.error("Error loading dynamic content:", e);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <SiteLayout>
      {/* HERO CAROUSEL */}
      <section className="relative">
        <Carousel
          setApi={setApi}
          opts={{ loop: true }}
          plugins={[Autoplay({ delay: 5500, stopOnInteraction: false })]}
          className="w-full"
        >
          <CarouselContent>
            {slides.map((s, i) => (
              <CarouselItem key={s.id}>
                <div className="relative h-[78vh] min-h-[560px] w-full overflow-hidden">
                  <img
                    src={convertGoogleDriveLink(s.src)}
                    alt={s.title}
                    className="absolute inset-0 h-full w-full object-cover scale-105"
                    {...(i === 0 ? {} : { loading: "lazy" as const })}
                  />
                  <div className="absolute inset-0" style={{ background: "var(--gradient-hero-overlay)" }} />
                  <div className="absolute inset-0 flex items-end pb-20 md:pb-28">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
                      <div className="max-w-3xl">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/40 text-primary text-xs uppercase tracking-[0.25em] font-semibold backdrop-blur-sm">
                          <Flame className="h-3.5 w-3.5" /> AMOI · Bravos Guerreiros
                        </span>
                        <h1 className="mt-5 text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.05] text-gradient-gold drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
                          {s.title}
                        </h1>
                        <p className="mt-4 text-lg md:text-xl text-foreground/90 max-w-2xl">{s.subtitle}</p>
                        <div className="mt-8 flex flex-wrap gap-3">
                          <Button asChild size="lg" className="bg-gradient-gold text-primary-foreground font-semibold shadow-gold hover:opacity-90">
                            <Link to="/cultos">Assistir Cultos <ArrowRight className="ml-1 h-4 w-4" /></Link>
                          </Button>
                          <Button asChild size="lg" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
                            <Link to="/sobre">Sobre a Igreja</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4 md:left-8 bg-background/60 border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground" />
          <CarouselNext className="right-4 md:right-8 bg-background/60 border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground" />
        </Carousel>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => api?.scrollTo(i)}
              className={`h-1.5 rounded-full transition-all ${i === current ? "w-10 bg-primary" : "w-2 bg-foreground/40 hover:bg-foreground/60"}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* WELCOME */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-14 items-center">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">
              {info.welcomeSubtitle || "Bem-vindo"}
            </span>
            <h2 className="mt-3 text-4xl md:text-5xl font-bold">
              {info.welcomeTitle.toLowerCase().includes("oração") ? (
                <>
                  {info.welcomeTitle.split(/oração/i)[0]}
                  <span className="text-gradient-gold">oração</span>
                  {info.welcomeTitle.split(/oração/i)[1]}
                </>
              ) : (
                info.welcomeTitle
              )}
            </h2>
            <div className="gold-divider w-32 my-6" />
            <p className="text-muted-foreground leading-relaxed text-lg font-sans">
              {info.welcomeDesc}
            </p>
            {info.welcomeSecondary ? (
              <p className="mt-4 text-muted-foreground leading-relaxed font-sans">
                {info.welcomeSecondary}
              </p>
            ) : (
              <p className="mt-4 text-muted-foreground leading-relaxed font-sans">
                Sejas tu novo na fé ou caminhando há muito tempo, há um lugar reservado para ti entre os
                <strong className="text-primary"> Bravos Guerreiros da Fé</strong>.
              </p>
            )}
            <Button asChild className="mt-8 bg-gradient-fire text-secondary-foreground shadow-ember font-semibold cursor-pointer">
              <Link to="/sobre">Conhecer a Nossa História <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-gold opacity-20 blur-3xl rounded-full" />
            <img 
              src={info.welcomeImage ? convertGoogleDriveLink(info.welcomeImage) : worship} 
              alt="Comunidade em oração" 
              className="relative rounded-2xl shadow-elevated border border-primary/20 w-full object-cover max-h-[400px]" 
              loading="lazy" 
            />
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="py-20 border-y border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">Os nossos pilares</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold">Fundamentos que nos sustentam</h2>
            <div className="gold-divider w-32 mx-auto my-5" />
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { Icon: HandHeart, title: "Oração", desc: "A oração é o oxigénio da nossa caminhada espiritual." },
              { Icon: BookOpenText, title: "Palavra", desc: "Ensino bíblico fiel, prático e transformador." },
              { Icon: Flame, title: "Adoração", desc: "Um louvor genuíno que exalta o nome do Senhor." },
              { Icon: Users, title: "Comunhão", desc: "Uma família que se ama, ora e cresce em conjunto." },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="group relative p-7 rounded-2xl bg-card border border-border/60 hover:border-primary/50 transition-all hover:-translate-y-1">
                <div className="h-12 w-12 rounded-xl bg-gradient-gold flex items-center justify-center mb-5 shadow-gold">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl text-primary mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ANNOUNCEMENTS / NEWS WALL */}
      {announcements.length > 0 && (
        <section className="py-24 bg-card/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">Mural</span>
              <h2 className="mt-3 text-4xl font-bold">Notícias & Eventos</h2>
              <div className="gold-divider w-32 mx-auto my-5" />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  onClick={() => setSelectedAnn(ann)}
                  className={`relative group p-8 rounded-3xl bg-card border hover:scale-[1.01] transition-all duration-300 shadow-elevated cursor-pointer flex flex-col justify-between ${
                    ann.category === "Aviso"
                      ? "border-destructive/30 hover:border-destructive/50"
                      : "border-border/60 hover:border-primary/40"
                  }`}
                >
                  <div>
                    <div className={`absolute top-0 right-8 -translate-y-1/2 px-4 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest ${
                      ann.category === "Aviso"
                        ? "bg-gradient-fire text-secondary-foreground shadow-ember"
                        : "bg-gradient-gold text-primary-foreground shadow-gold"
                    }`}>
                      {ann.category}
                    </div>
                    {ann.imageUrl && (
                      <div className="aspect-video w-full rounded-2xl overflow-hidden mb-6 border border-border/50 relative">
                        <img src={convertGoogleDriveLink(ann.imageUrl)} alt={ann.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-primary" /> {ann.date}</span>
                      <span className="flex items-center gap-1"><User className="h-3.5 w-3.5 text-primary" /> {ann.author}</span>
                    </div>
                    <h3 className="font-display text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-3 flex items-center gap-2">
                      {ann.category === "Aviso" && <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />}
                      {ann.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm line-clamp-3">
                      {ann.content}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/40 flex justify-end">
                    <span className="text-xs text-primary font-bold flex items-center gap-1 group-hover:underline">
                      Continuar a ler <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              ))}
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
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          selectedAnn.category === "Aviso"
                            ? "bg-destructive/10 border border-destructive/20 text-destructive"
                            : "bg-primary/10 border border-primary/20 text-primary"
                        }`}>
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
          </div>
        </section>
      )}

      {/* SCHEDULE */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-14 items-center">
          <div className="order-2 md:order-1 relative">
            <div className="absolute -inset-4 bg-gradient-fire opacity-20 blur-3xl rounded-full" />
            <img src={worship} alt="Culto AMOI" className="relative rounded-2xl shadow-elevated border border-primary/20" loading="lazy" />
          </div>
          <div className="order-1 md:order-2">
            <span className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">Programação</span>
            <h2 className="mt-3 text-4xl md:text-5xl font-bold">
              Vem participar dos nossos <span className="text-gradient-gold">cultos</span>.
            </h2>
            <div className="gold-divider w-32 my-6" />
            <ul className="space-y-4">
              {info.schedule.map((s) => (
                <li key={s.day} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/60 hover:border-primary/50 transition-colors">
                  <div className="h-12 w-12 rounded-lg bg-secondary/30 border border-secondary flex items-center justify-center text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-display text-lg text-foreground">{s.day}</div>
                    <div className="text-sm text-muted-foreground">{s.time}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl p-12 md:p-16 text-center border border-primary/30 bg-gradient-to-br from-card via-card to-secondary/20">
              <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-radial-gold)" }} />
              <div className="relative">
                <Flame className="h-10 w-10 text-primary mx-auto animate-flicker" />
                <h2 className="mt-5 text-3xl md:text-5xl font-bold">
                  Junta-te a <span className="text-gradient-gold">Familia AMOI</span>
                </h2>
                <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                  Cria a tua conta de membro para acompanhares os cultos gravados, agenda e conteúdos exclusivos da igreja.
                </p>
                <div className="mt-8 flex flex-wrap gap-3 justify-center">
                  <Button asChild size="lg" className="bg-gradient-gold text-primary-foreground font-semibold shadow-gold">
                    <Link to="/registro">Registar Conta</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
                    <Link to="/login">Já sou membro</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </SiteLayout>
  );
}
