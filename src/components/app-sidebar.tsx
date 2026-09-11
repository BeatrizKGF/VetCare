import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Briefcase,
  Calendar,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  Package,
  PawPrint,
  Settings,
  Stethoscope,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

import { useAuth } from "@/lib/auth-store";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const groups = [
  {
    label: "Navegação principal",
    items: [{ title: "Página Inicial", url: "/home", icon: Home }],
  },
  {
    label: "Operação & Atendimento",
    items: [
      { title: "Agendamentos", url: "/agendamentos", icon: Calendar },
      { title: "Prontuários", url: "/prontuarios", icon: Stethoscope },
      { title: "Pets", url: "/pets", icon: PawPrint },
      { title: "Tutores", url: "/tutores", icon: Users },
    ],
  },
  {
    label: "Apoio & Cadastros",
    items: [
      { title: "Veterinários", url: "/veterinarios", icon: UserCheck },
      { title: "Serviços", url: "/servicos", icon: Briefcase },
      { title: "Estoque / Produtos", url: "/estoque", icon: Package },
    ],
  },
  {
    label: "Gestão & Análise",
    items: [
      { title: "Financeiro", url: "/financeiro", icon: Wallet },
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Configurações", url: "/configuracoes", icon: Settings },
    ],
  },
] as const;

export function AppSidebar() {
  const currentPath = useRouterState({ select: (router) => router.location.pathname });
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const isActive = (path: string) =>
    path === "/home"
      ? currentPath === "/home" || currentPath === "/"
      : currentPath.startsWith(path);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/home" className="flex items-center gap-2.5 px-2 py-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <PawPrint className="size-5" />
          </span>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-lg font-extrabold leading-tight tracking-tight">
              VetCare
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              Gestão veterinária
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon className="size-4" />
                        <span className="font-semibold">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {user ? (
          <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-extrabold uppercase text-primary">
              {user.nome.slice(0, 2)}
            </span>
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-xs font-bold">{user.nome}</p>
              <p className="truncate text-[11px] capitalize text-muted-foreground">{user.perfil}</p>
            </div>
            <button
              type="button"
              aria-label="Sair"
              title="Sair"
              onClick={() => {
                signOut();
                void navigate({ to: "/login", replace: true });
              }}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground group-data-[collapsible=icon]:hidden"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        ) : null}
        <div className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:justify-center">
          <Heart className="size-3.5 shrink-0 text-primary" />
          <span className="group-data-[collapsible=icon]:hidden">
            Feito com carinho para pets
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
