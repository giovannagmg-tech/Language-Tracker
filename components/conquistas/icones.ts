import { createElement } from "react";
import {
  Activity,
  Anchor,
  AudioLines,
  BookMarked,
  BookOpen,
  Briefcase,
  CalendarCheck,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CalendarFold,
  CalendarHeart,
  CalendarPlus,
  CalendarRange,
  ClipboardCheck,
  Crown,
  Flame,
  Footprints,
  Globe,
  GraduationCap,
  Hourglass,
  Languages,
  Layers,
  LibraryBig,
  LifeBuoy,
  ListChecks,
  Megaphone,
  Mic,
  MicVocal,
  Milestone,
  PackageCheck,
  PenLine,
  Plane,
  Radio,
  RefreshCw,
  Repeat,
  Repeat2,
  RotateCcw,
  Rocket,
  Scale,
  Shapes,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  Video,
  Volume2,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Um ícone por conquista, indexado pelo código do catálogo (`supabase/seed.sql`).
 * O troféu genérico dizia só "você ganhou alguma coisa"; o ícone específico
 * lembra **qual** — que é o que faz a grade ser lida de relance.
 *
 * Código sem entrada aqui cai no troféu. Conquista nova entra no catálogo e
 * aqui, e o teste `conquistas-icones` falha enquanto faltar.
 */
export const ICONE_POR_CODIGO: Record<string, LucideIcon> = {
  // Consistência — o calendário conta a história
  "CON-01": CalendarCheck,
  "CON-02": CalendarRange,
  "CON-03": CalendarDays,
  "CON-04": CalendarClock,
  "CON-05": Flame,
  "CON-06": CalendarHeart,
  "CON-07": CalendarCheck2,
  "CON-08": Footprints,
  "CON-09": Milestone,
  "CON-10": CalendarPlus,
  "CON-11": CalendarFold,

  // Camadas — cada uma é um mundo que abre
  "CAM-01": Plane,
  "CAM-02": Users,
  "CAM-03": Briefcase,
  "CAM-04": GraduationCap,
  "CAM-05": Crown,
  "CAM-06": Globe,
  "CAM-07": BookMarked,

  // Produção — boca, áudio, vídeo, caneta
  "PRO-01": Mic,
  "PRO-02": MicVocal,
  "PRO-03": Timer,
  "PRO-04": AudioLines,
  "PRO-05": Radio,
  "PRO-06": Video,
  "PRO-07": Activity,
  "PRO-08": Scale,
  "PRO-09": Megaphone,
  "PRO-10": TrendingUp,
  "PRO-11": UserCheck,
  "PRO-12": Languages,
  "PRO-13": PenLine,

  // Método — a disciplina do processo
  "MET-01": Layers,
  "MET-02": LibraryBig,
  "MET-03": Zap,
  "MET-04": Sparkles,
  "MET-05": Volume2,
  "MET-06": ClipboardCheck,
  "MET-07": ShieldCheck,
  "MET-08": ListChecks,
  "MET-09": Hourglass,
  "MET-10": Shapes,
  "MET-11": Target,
  "MET-12": Repeat,
  "MET-13": BookOpen,
  "MET-14": PackageCheck,
  "MET-15": Rocket,

  // Recuperação — a categoria que o método mais preza
  "REC-01": RotateCcw,
  "REC-02": RefreshCw,
  "REC-03": Anchor,
  "REC-04": Repeat2,
  "REC-05": LifeBuoy,
};

export function iconeDaConquista(codigo: string): LucideIcon {
  return ICONE_POR_CODIGO[codigo] ?? Trophy;
}

/**
 * `createElement` em vez de `const Icone = …; <Icone />`: a referência vinda do
 * mapa é estável (o objeto é do módulo), mas a regra `static-components` não
 * consegue provar isso na forma de variável maiúscula.
 */
export function IconeConquista({
  codigo,
  className,
  strokeWidth = 1.75,
}: {
  codigo: string;
  className?: string;
  strokeWidth?: number;
}) {
  return createElement(iconeDaConquista(codigo), { className, strokeWidth });
}
