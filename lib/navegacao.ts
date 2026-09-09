import {
  BookOpen,
  CalendarCheck,
  LayoutDashboard,
  Library,
  History,
  ListTodo,
  PieChart,
  PlusCircle,
  RotateCcw,
  Rows3,
  Settings,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export type ItemNav = {
  href: string;
  rotulo: string;
  icone: LucideIcon;
  /** chave do contador de pendências no badge (RN-1102) */
  badge?: "hoje" | "tarefas" | "revisao";
};

/**
 * Ordem da sidebar — docs/04, seção 0.2.
 *
 * CONFLITO ANUNCIADO: o documento fixa doze itens e "Histórico" não é um
 * deles. Ela pediu a tela; entrou logo depois de "Registro de Estudo", que é
 * onde faz sentido — registrar e depois rever o que foi registrado. O resto
 * da ordem continua intocado.
 */
export const NAVEGACAO: ItemNav[] = [
  { href: "/dashboard", rotulo: "Dashboard", icone: LayoutDashboard },
  { href: "/hoje", rotulo: "Hoje", icone: CalendarCheck, badge: "hoje" },
  { href: "/registro", rotulo: "Registro de Estudo", icone: PlusCircle },
  { href: "/historico", rotulo: "Histórico", icone: History },
  { href: "/tarefas", rotulo: "Tarefas", icone: ListTodo, badge: "tarefas" },
  { href: "/flashcards", rotulo: "Flashcards", icone: Rows3 },
  { href: "/metas", rotulo: "Metas", icone: Target },
  { href: "/revisao", rotulo: "Revisão", icone: RotateCcw, badge: "revisao" },
  { href: "/materiais", rotulo: "Materiais de Estudo", icone: BookOpen },
  { href: "/recursos", rotulo: "Recursos", icone: Library },
  { href: "/distribuicao", rotulo: "Planilha de Distribuição", icone: PieChart },
  { href: "/conquistas", rotulo: "Conquistas", icone: Trophy },
  { href: "/configuracoes", rotulo: "Configurações", icone: Settings },
];
