import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { AuthProvider } from "../hooks/useAuth";


import "@fontsource/cinzel/400.css";
import "@fontsource/cinzel/600.css";
import "@fontsource/cinzel/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { getInitialThemeScript } from "@/components/ThemeToggle";
import { SiteLayout } from "../components/SiteLayout";
import { Flame } from "lucide-react";

function NotFoundComponent() {
  return (
    <SiteLayout>
      <section className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-4 py-16 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: "var(--gradient-radial-gold)" }} />

        <div className="relative max-w-md w-full text-center bg-card/60 backdrop-blur-xl border border-primary/20 rounded-3xl p-10 shadow-elevated">
          <div className="h-20 w-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary mb-6 border border-primary/30 shadow-gold">
            <Flame className="h-10 w-10 animate-pulse" />
          </div>

          <h1 className="font-display text-7xl font-extrabold text-gradient-gold">404</h1>
          <h2 className="mt-4 font-display text-xl font-bold text-foreground">Página Não Encontrada</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            A página que procura não existe, foi removida ou o endereço de acesso está incorreto.
          </p>

          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl bg-gradient-gold text-primary-foreground font-bold shadow-gold hover:opacity-90 transition-all cursor-pointer text-sm"
            >
              Voltar ao Início
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AMOI — Associação Ministério de Oração e Intercessão" },
      { name: "description", content: "AMOI — Bravos Guerreiros da Fé. Comunidade de oração, intercessão e adoração." },
      { name: "author", content: "AMOI" },
      { property: "og:title", content: "AMOI — Associação Ministério de Oração e Intercessão" },
      { property: "og:description", content: "AMOI — Bravos Guerreiros da Fé. Comunidade de oração, intercessão e adoração." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "AMOI — Associação Ministério de Oração e Intercessão" },
      { name: "twitter:description", content: "AMOI — Bravos Guerreiros da Fé. Comunidade de oração, intercessão e adoração." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e6a6f4fa-c7af-45f5-a98b-61cb2e9ba214/id-preview-edd2c042--b87998c7-2c01-44fe-b594-f1eadd4a4603.lovable.app-1781990654257.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e6a6f4fa-c7af-45f5-a98b-61cb2e9ba214/id-preview-edd2c042--b87998c7-2c01-44fe-b594-f1eadd4a4603.lovable.app-1781990654257.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <script dangerouslySetInnerHTML={{ __html: getInitialThemeScript() }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
