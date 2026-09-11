import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Link,
  createRootRouteWithContext,
  useNavigate,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/auth-store";
import { PetCareProvider } from "@/lib/petcare-store";

const PAGE_TITLES: Record<string, string> = {
  "/": "Página Inicial",
  "/home": "Página Inicial",
  "/dashboard": "Dashboard",
  "/prontuarios": "Prontuários",
  "/estoque": "Estoque / Produtos",
  "/financeiro": "Financeiro",
  "/agendamentos": "Agendamentos",
  "/tutores": "Tutores",
  "/pets": "Pets",
  "/veterinarios": "Veterinários",
  "/servicos": "Serviços",
  "/configuracoes": "Configurações",
};

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-extrabold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-bold">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/home"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar à Página Inicial
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-bold tracking-tight">Esta página não carregou</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado por aqui. Tente novamente ou volte ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-card px-4 py-2 text-sm font-bold transition-colors hover:bg-accent"
          >
            Ir para o início
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
      { title: "VetCare — Gestão para Clínicas Veterinárias e Petshops" },
      {
        name: "description",
        content:
          "VetCare: sistema de gestão para clínicas veterinárias e petshops. Cadastre tutores, gerencie pets e acompanhe métricas da clínica em um painel simples e moderno.",
      },
      { name: "author", content: "VetCare" },
      { property: "og:title", content: "VetCare — Gestão para Clínicas Veterinárias" },
      {
        property: "og:description",
        content:
          "Cadastre tutores, gerencie pets e acompanhe as métricas da sua clínica veterinária ou petshop.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400..900;1,400..900&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        <RootProviders>{children}</RootProviders>
        <Scripts />
      </body>
    </html>
  );
}

function RootProviders({ children }: { children: ReactNode }) {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PetCareProvider>
          <AppShell>{children}</AppShell>
        </PetCareProvider>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const isLoginRoute = pathname === "/login";

  useEffect(() => {
    if (ready && !user && !isLoginRoute) {
      void navigate({ to: "/login", replace: true });
    }
  }, [ready, user, isLoginRoute, navigate]);

  const pageTitle =
    PAGE_TITLES[pathname] ??
    Object.entries(PAGE_TITLES).find(([p]) => p !== "/" && pathname.startsWith(p))?.[1] ??
    "VetCare";

  if (isLoginRoute) return <>{children}</>;

  // Mantém a árvore de rotas montada (dentro dos providers) mesmo enquanto a
  // sessão é verificada — desmontá-la faz o React renderizar as rotas fora do
  // contexto e quebra os hooks de dados.
  if (!ready || !user) {
    return (
      <>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
        <div hidden>{children}</div>
      </>
    );
  }

  return (
    <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur-sm md:px-6">
              <SidebarTrigger />
              <span className="text-sm font-bold text-muted-foreground">{pageTitle}</span>
            </header>
            <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
          </div>
        </div>
    </SidebarProvider>
  );
}

