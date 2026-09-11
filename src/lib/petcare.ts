import {
  Bird,
  Cat,
  Dog,
  Fish,
  PawPrint,
  Rabbit,
  Squirrel,
  type LucideIcon,
} from "lucide-react";

export type Especie = "Cão" | "Gato" | "Ave" | "Coelho" | "Roedor" | "Peixe" | "Outro";
export type Porte = "Pequeno" | "Médio" | "Grande";
/** Sexo gravado no banco como char(1): 'M' | 'F' */
export type Sexo = "M" | "F";
export type StatusAgendamento = "Agendado" | "Em Atendimento" | "Concluído" | "Cancelado";

export const SEXO_LABEL: Record<Sexo, string> = { M: "Macho", F: "Fêmea" };

export const STATUS_CORES: Record<StatusAgendamento, string> = {
  Agendado: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  "Em Atendimento": "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  Concluído: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  Cancelado: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
};

export interface Tutor {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  endereco: string;
  criadoEm: string;
}

export interface Pet {
  id: string;
  nome: string;
  tutorId: string;
  tutorNome?: string | undefined;
  especie: Especie;
  raca: string;
  porte: Porte;
  nascimento: string;
  sexo: Sexo;
  observacoes: string;
  criadoEm: string;
}

export interface Veterinario {
  id: string;
  nome: string;
  crmv: string;
  especialidade: string;
  telefone: string;
  email: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Servico {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  duracaoMinutos: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Agendamento {
  id: string;
  petId: string;
  veterinarioId: string;
  servicoId: string;
  dataHora: string;
  status: StatusAgendamento;
  observacoes: string;
  criadoEm: string;
  atualizadoEm: string;
  petNome?: string | undefined;
  tutorNome?: string | undefined;
  especie?: Especie | undefined;
  veterinarioNome?: string | undefined;
  servicoNome?: string | undefined;
  servicoPreco?: number | undefined;
  servicoDuracao?: number | undefined;
}

export const ESPECIES: Especie[] = ["Cão", "Gato", "Ave", "Coelho", "Roedor", "Peixe", "Outro"];
export const PORTES: Porte[] = ["Pequeno", "Médio", "Grande"];

export const ESPECIE_META: Record<
  Especie,
  { icon: LucideIcon; chip: string; avatar: string }
> = {
  Cão: { icon: Dog, chip: "bg-pet-mint/12 text-pet-mint", avatar: "bg-pet-mint/15 text-pet-mint" },
  Gato: { icon: Cat, chip: "bg-pet-lilac/12 text-pet-lilac", avatar: "bg-pet-lilac/15 text-pet-lilac" },
  Ave: { icon: Bird, chip: "bg-pet-sky/12 text-pet-sky", avatar: "bg-pet-sky/15 text-pet-sky" },
  Coelho: { icon: Rabbit, chip: "bg-pet-rose/12 text-pet-rose", avatar: "bg-pet-rose/15 text-pet-rose" },
  Roedor: { icon: Squirrel, chip: "bg-pet-sand/15 text-pet-sand", avatar: "bg-pet-sand/20 text-pet-sand" },
  Peixe: { icon: Fish, chip: "bg-pet-sky/12 text-pet-sky", avatar: "bg-pet-sky/15 text-pet-sky" },
  Outro: { icon: PawPrint, chip: "bg-pet-orange/12 text-pet-orange", avatar: "bg-pet-orange/15 text-pet-orange" },
};

export function formatAge(nascimento: string): string {
  const birth = new Date(nascimento + "T00:00:00");
  if (Number.isNaN(birth.getTime())) return "—";
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  if (years <= 0) {
    if (months <= 0) return "Recém-nascido";
    return months === 1 ? "1 mês" : `${months} meses`;
  }
  const y = years === 1 ? "1 ano" : `${years} anos`;
  if (months === 0) return y;
  const m = months === 1 ? "1 mês" : `${months} meses`;
  return `${y} e ${m}`;
}

export function isThisMonth(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function normalizeSearch(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function toDatetimeLocal(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ------------------------- Estoque / Produtos -------------------------

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  precoCusto: number;
  precoVenda: number;
  quantidadeEstoque: number;
  estoqueMinimo: number;
  unidadeMedida: string;
  dataValidade: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export const CATEGORIAS_PRODUTO = [
  "Medicamento",
  "Vacina",
  "Ração",
  "Higiene",
  "Acessório",
  "Material Clínico",
  "Outro",
];

export const UNIDADES_MEDIDA = ["UN", "CX", "KG", "G", "L", "ML", "FR", "PC"];

export function estoqueBaixo(p: Produto): boolean {
  return p.quantidadeEstoque <= p.estoqueMinimo;
}

export function estoqueZerado(p: Produto): boolean {
  return p.quantidadeEstoque <= 0;
}

export function validadeProxima(dataValidade: string, dias = 30): boolean {
  if (!dataValidade) return false;
  const d = new Date(dataValidade + "T00:00:00");
  if (Number.isNaN(d.getTime())) return false;
  const limite = new Date();
  limite.setDate(limite.getDate() + dias);
  return d <= limite;
}

// ------------------------- Financeiro -------------------------

export type TipoTransacao = "Receita" | "Despesa";
export type StatusTransacao = "Pendente" | "Pago" | "Atrasado" | "Cancelado";

export const TIPOS_TRANSACAO: TipoTransacao[] = ["Receita", "Despesa"];
export const STATUS_TRANSACAO: StatusTransacao[] = ["Pendente", "Pago", "Atrasado", "Cancelado"];

export const FORMAS_PAGAMENTO = [
  "PIX",
  "Dinheiro",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Boleto",
  "Transferência",
];

export const CATEGORIAS_RECEITA = [
  "Consultas",
  "Serviços",
  "Vendas de Produtos",
  "Vacinas",
  "Exames",
  "Outros",
];

export const CATEGORIAS_DESPESA = [
  "Fornecedores",
  "Salários",
  "Aluguel",
  "Contas (Água/Luz/Internet)",
  "Impostos",
  "Manutenção",
  "Marketing",
  "Outros",
];

export const STATUS_TRANSACAO_CORES: Record<StatusTransacao, string> = {
  Pendente: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  Pago: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  Atrasado: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  Cancelado: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700",
};

export interface TransacaoFinanceira {
  id: string;
  descricao: string;
  tipo: TipoTransacao;
  categoria: string;
  valor: number;
  dataVencimento: string;
  dataPagamento: string;
  status: StatusTransacao;
  formaPagamento: string;
  tutorId: string;
  agendamentoId: string;
  observacoes: string;
  criadoEm: string;
  atualizadoEm: string;
  tutorNome?: string | undefined;
}

/** Formata datas puras (YYYY-MM-DD) sem deslocamento de fuso. */
export function formatDateOnly(value: string): string {
  if (!value) return "—";
  const d = new Date(value.length <= 10 ? value + "T00:00:00" : value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function todayISODate(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isThisMonthDateOnly(value: string): boolean {
  if (!value) return false;
  const d = new Date(value.length <= 10 ? value + "T00:00:00" : value);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function isVencida(t: TransacaoFinanceira): boolean {
  if (t.status !== "Pendente" || !t.dataVencimento) return false;
  return t.dataVencimento < todayISODate();
}
