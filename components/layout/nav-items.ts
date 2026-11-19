import {
  Bell,
  Crosshair,
  FolderKanban,
  FolderOpen,
  Globe2,
  GraduationCap,
  History,
  Home,
  Lightbulb,
  ListChecks,
  Search,
  Settings,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Visão geral", icon: Home, exact: true },
  { href: "/foco", label: "Meu foco", icon: Crosshair },
  { href: "/projetos", label: "Projetos", icon: FolderKanban },
  { href: "/tarefas", label: "Tarefas", icon: ListChecks },
  { href: "/cursos", label: "Cursos", icon: GraduationCap },
  { href: "/arquivos", label: "Arquivos", icon: FolderOpen },
  { href: "/portfolio", label: "Portfólio", icon: Globe2 },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/backlog", label: "Ideias e backlog", icon: Lightbulb },
  { href: "/notificacoes", label: "Notificações", icon: Bell },
  { href: "/busca", label: "Busca", icon: Search },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/lixeira", label: "Lixeira", icon: Trash2 },
  { href: "/espacos", label: "Espaços e pessoas", icon: Users },
];

export const SETTINGS_NAV: NavItem = {
  href: "/configuracoes",
  label: "Configurações",
  icon: Settings,
};

export const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV, SETTINGS_NAV];

export function isActivePath(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function currentPageLabel(pathname: string): string {
  const item = ALL_NAV.find((entry) => isActivePath(pathname, entry));
  return item?.label ?? "ÓRBITA";
}
